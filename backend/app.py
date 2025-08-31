import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TF warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN if needed

from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import joblib
import numpy as np
import tensorflow as tf
import tf_keras
from tf_keras.preprocessing.sequence import pad_sequences
from transformers import BertTokenizer, BertForSequenceClassification, RobertaTokenizer, RobertaForSequenceClassification
from preprocess import preprocess_text
from dotenv import load_dotenv
import zipfile
from datetime import datetime
import logging
import torch

tf.get_logger().setLevel('ERROR')

logging.basicConfig(level=logging.INFO)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "https://cyberbully-ai.vercel.app"]}})

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
print('SUPABASE_URL:', SUPABASE_URL)
print('SUPABASE_KEY:', SUPABASE_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def download_model(bucket_name, file_name, local_path):
    try:
        if not os.path.exists(local_path):
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            response = supabase.storage.from_(bucket_name).download(file_name)
            with open(local_path, 'wb') as f:
                f.write(response)
            if local_path.endswith('.zip'):
                with zipfile.ZipFile(local_path, 'r') as zip_ref:
                    zip_ref.extractall(os.path.dirname(local_path))
                os.remove(local_path)
            logging.info(f"Downloaded {file_name} to {local_path}")
        return True
    except Exception as e:
        logging.error(f"Failed to download {file_name}: {str(e)}")
        return False

# Download models
os.makedirs('models', exist_ok=True)
model_files = [
    ('models', 'tfidf_vectorizer.pkl', 'models/tfidf_vectorizer.pkl'),
    ('models', 'svm_model.pkl', 'models/svm_model.pkl'),
    ('models', 'nb_model.pkl', 'models/nb_model.pkl'),
    ('models', 'keras_tokenizer.pkl', 'models/keras_tokenizer.pkl'),
    ('models', 'cnn_model.keras', 'models/cnn_model.keras'),
    ('models', 'lstm_model.keras', 'models/lstm_model.keras'),
    ('models', 'bert_model.zip', 'models/bert_model.zip'),
    ('models', 'bert_tokenizer.zip', 'models/bert_tokenizer.zip'),
    ('models', 'roberta_model.zip', 'models/roberta_model.zip'),
    ('models', 'roberta_tokenizer.zip', 'models/roberta_tokenizer.zip')
]

loaded_models = {}
for bucket, file_name, local_path in model_files:
    if download_model(bucket, file_name, local_path):
        loaded_models[file_name] = local_path

# Load models and preprocessors
try:
    tfidf = joblib.load('models/tfidf_vectorizer.pkl') if 'tfidf_vectorizer.pkl' in loaded_models else None
    svm = joblib.load('models/svm_model.pkl') if 'svm_model.pkl' in loaded_models else None
    nb = joblib.load('models/nb_model.pkl') if 'nb_model.pkl' in loaded_models else None
    tokenizer = joblib.load('models/keras_tokenizer.pkl') if 'keras_tokenizer.pkl' in loaded_models else None
    cnn_model = tf_keras.models.load_model('models/cnn_model.keras') if 'cnn_model.keras' in loaded_models else None
    lstm_model = tf_keras.models.load_model('models/lstm_model.keras') if 'lstm_model.keras' in loaded_models else None
    bert_tokenizer = BertTokenizer.from_pretrained('models/bert_tokenizer') if 'bert_tokenizer.zip' in loaded_models else None
    bert_model = BertForSequenceClassification.from_pretrained('models/bert_model') if 'bert_model.zip' in loaded_models else None
    roberta_tokenizer = RobertaTokenizer.from_pretrained('models/roberta_tokenizer') if 'roberta_tokenizer.zip' in loaded_models else None
    roberta_model = RobertaForSequenceClassification.from_pretrained('models/roberta_model') if 'roberta_model.zip' in loaded_models else None
except Exception as e:
    logging.error(f"Error loading models: {str(e)}")

# Configuration for deep learning
max_words = 5000
max_len = 100

# Authentication middleware
def verify_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None, None, None  # Allow anonymous access
    try:
        token = auth_header.split()[1]
        user = supabase.auth.get_user(token)
        return user, None, None
    except Exception as e:
        return None, jsonify({'error': f'Invalid token: {str(e)}'}), 401

# Root route for testing
@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'Welcome to Cyberbullying Detection API', 'endpoints': ['/api/ping', '/api/predict', '/api/report']})

# Ping endpoint
@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'message': 'Backend is running', 'timestamp': datetime.now().isoformat()})

# Prediction endpoint
@app.route('/api/predict', methods=['POST'])
def predict():
    user, error, status = verify_user()
    if error:
        return error, status  # Only return error for invalid tokens, not missing ones

    data = request.get_json()
    text = data.get('text')
    if not text:
        return jsonify({'error': 'Text required'}), 400

    try:
        processed_text = preprocess_text(text)
        predictions = {}
        probabilities = {}

        # Traditional ML models
        if tfidf and svm:
            tfidf_features = tfidf.transform([processed_text])
            predictions['svm'] = 'Cyberbullying' if svm.predict(tfidf_features)[0] == 1 else 'Non-Cyberbullying'
            probabilities['svm'] = svm.predict_proba(tfidf_features)[0][1] if hasattr(svm, 'predict_proba') else 0.5
        if tfidf and nb:
            predictions['naive_bayes'] = 'Cyberbullying' if nb.predict(tfidf_features)[0] == 1 else 'Non-Cyberbullying'
            probabilities['naive_bayes'] = nb.predict_proba(tfidf_features)[0][1] if hasattr(nb, 'predict_proba') else 0.5

        # Deep learning models
        if tokenizer and cnn_model:
            seq = tokenizer.texts_to_sequences([processed_text])
            padded_seq = pad_sequences(seq, maxlen=max_len)
            cnn_prob = cnn_model.predict(padded_seq, verbose=0)[0][0]
            predictions['cnn'] = 'Cyberbullying' if cnn_prob > 0.5 else 'Non-Cyberbullying'
            probabilities['cnn'] = float(cnn_prob)
        if tokenizer and lstm_model:
            lstm_prob = lstm_model.predict(padded_seq, verbose=0)[0][0]
            predictions['lstm'] = 'Cyberbullying' if lstm_prob > 0.5 else 'Non-Cyberbullying'
            probabilities['lstm'] = float(lstm_prob)

        # Transformer models
        if bert_tokenizer and bert_model:
            bert_input = bert_tokenizer([processed_text], padding=True, truncation=True, max_length=max_len, return_tensors='pt')
            with torch.no_grad():
                bert_output = bert_model(**bert_input).logits
            bert_prob = torch.softmax(bert_output, dim=1)[0][1].numpy()
            predictions['bert'] = 'Cyberbullying' if torch.argmax(bert_output, dim=1).numpy()[0] == 1 else 'Non-Cyberbullying'
            probabilities['bert'] = float(bert_prob)
        if roberta_tokenizer and roberta_model:
            roberta_input = roberta_tokenizer([processed_text], padding=True, truncation=True, max_length=max_len, return_tensors='pt')
            with torch.no_grad():
                roberta_output = roberta_model(**roberta_input).logits
            roberta_prob = torch.softmax(roberta_output, dim=1)[0][1].numpy()
            predictions['roberta'] = 'Cyberbullying' if torch.argmax(roberta_output, dim=1).numpy()[0] == 1 else 'Non-Cyberbullying'
            probabilities['roberta'] = float(roberta_prob)

        # Store prediction in Supabase only if user is authenticated
        if user:
            supabase.table('predictions').insert({
                'user_id': user.user.id,
                'text': text,
                'prediction': predictions,
                'probabilities': probabilities
            }).execute()

        return jsonify({
            'text': text,
            'predictions': predictions,
            'probabilities': probabilities,
            'message': 'Prediction successful'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Report endpoint (still requires authentication)
@app.route('/api/report', methods=['GET'])
def report():
    user, error, status = verify_user()
    if error or not user:
        return jsonify({'error': 'Authentication required for reports'}), 401

    try:
        response = supabase.table('predictions').select('*').eq('user_id', user.user.id).execute()
        return jsonify({'reports': response.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
