# train.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
from imblearn.over_sampling import SMOTE
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import tf_keras
from tf_keras.preprocessing.text import Tokenizer
from tf_keras.preprocessing.sequence import pad_sequences
from tf_keras.models import Sequential
from tf_keras.layers import Embedding, Conv1D, MaxPooling1D, LSTM, Dense, Dropout
import torch
from transformers import BertTokenizer, BertForSequenceClassification, RobertaTokenizer, RobertaForSequenceClassification
from transformers import Trainer, TrainingArguments
import os
import joblib
import re

# Download NLTK resources
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('stopwords')
nltk.download('wordnet')

# Preprocessing functions
stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

def clean_text(text):
    if not isinstance(text, str):
        text = str(text)
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\\x[a-fA-F0-9]{2}', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def preprocess_text(text):
    text = clean_text(text)
    tokens = word_tokenize(text)
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return ' '.join(tokens)

# Load and preprocess dataset
try:
    data = pd.read_csv('Data.csv')
    print("Columns in Data.csv:", data.columns.tolist())  # Debug: Print column names
except FileNotFoundError:
    print("Error: Data.csv not found in the project directory")
    exit(1)

# Use correct column names from Data.csv
text_column = 'Text'  # Matches your dataset
label_column = 'oh_label'  # Matches your dataset

if text_column not in data.columns or label_column not in data.columns:
    print(f"Error: Required columns '{text_column}' and/or '{label_column}' not found in Data.csv")
    print("Available columns:", data.columns.tolist())
    exit(1)

data[text_column] = data[text_column].apply(preprocess_text)
X = data[text_column]
y = data[label_column]

# Split data
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# TF-IDF for SVM and Naïve Bayes
tfidf = TfidfVectorizer(max_features=5000)
X_train_tfidf = tfidf.fit_transform(X_train)
X_val_tfidf = tfidf.transform(X_val)

# Apply SMOTE for class balancing
smote = SMOTE(random_state=42)
X_train_tfidf_balanced, y_train_balanced = smote.fit_resample(X_train_tfidf, y_train)

# Train and evaluate SVM
svm = SVC(kernel='linear')
svm.fit(X_train_tfidf_balanced, y_train_balanced)
svm_pred = svm.predict(X_val_tfidf)
print("SVM Results:")
print("Confusion Matrix:", confusion_matrix(y_val, svm_pred))
print("Accuracy:", accuracy_score(y_val, svm_pred))
print("Precision:", precision_score(y_val, svm_pred))
print("Recall:", recall_score(y_val, svm_pred))
print("F1-Score:", f1_score(y_val, svm_pred))

# Train and evaluate Naïve Bayes
nb = MultinomialNB()
nb.fit(X_train_tfidf_balanced, y_train_balanced)
nb_pred = nb.predict(X_val_tfidf)
print("\nNaïve Bayes Results:")
print("Confusion Matrix:", confusion_matrix(y_val, nb_pred))
print("Accuracy:", accuracy_score(y_val, nb_pred))
print("Precision:", precision_score(y_val, nb_pred))
print("Recall:", recall_score(y_val, nb_pred))
print("F1-Score:", f1_score(y_val, nb_pred))

# Save traditional ML models
os.makedirs('models', exist_ok=True)
joblib.dump(tfidf, 'models/tfidf_vectorizer.pkl')
joblib.dump(svm, 'models/svm_model.pkl')
joblib.dump(nb, 'models/nb_model.pkl')

# Prepare data for deep learning
max_words = 5000
max_len = 100
tokenizer = tf_keras.preprocessing.text.Tokenizer(num_words=max_words)
tokenizer.fit_on_texts(X_train)
X_train_seq = tokenizer.texts_to_sequences(X_train)
X_val_seq = tokenizer.texts_to_sequences(X_val)
X_train_seq = pad_sequences(X_train_seq, maxlen=max_len)
X_val_seq = pad_sequences(X_val_seq, maxlen=max_len)

# Apply SMOTE for deep learning
X_train_seq_balanced, y_train_balanced = smote.fit_resample(X_train_seq, y_train)
print(f"X_train_seq_balanced shape: {X_train_seq_balanced.shape}")
print(f"y_train_balanced shape: {y_train_balanced.shape}")
print(f"X_val_seq shape: {X_val_seq.shape}")
print(f"y_val shape: {y_val.shape}")
print(f"Unique values in y_train_balanced: {np.unique(y_train_balanced)}")

# CNN Model
cnn_model = Sequential([
    Embedding(max_words, 128, input_length=max_len),
    Conv1D(128, 5, activation='relu'),
    MaxPooling1D(pool_size=2),
    tf_keras.layers.Flatten(),
    Dense(64, activation='relu'),
    Dropout(0.5),
    Dense(1, activation='sigmoid')
])
cnn_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
cnn_model.fit(X_train_seq_balanced, y_train_balanced, epochs=3, batch_size=32, validation_data=(X_val_seq, y_val))
cnn_pred = (cnn_model.predict(X_val_seq) > 0.5).astype(int)
print("\nCNN Results:")
print("Confusion Matrix:", confusion_matrix(y_val, cnn_pred))
print("Accuracy:", accuracy_score(y_val, cnn_pred))
print("Precision:", precision_score(y_val, cnn_pred))
print("Recall:", recall_score(y_val, cnn_pred))
print("F1-Score:", f1_score(y_val, cnn_pred))
cnn_model.save('models/cnn_model.keras')  # Updated to .keras format

joblib.dump(tokenizer, 'models/keras_tokenizer.pkl')

# LSTM Model
lstm_model = Sequential([
    Embedding(max_words, 128, input_length=max_len),
    LSTM(64, return_sequences=False),
    Dense(32, activation='relu'),
    Dropout(0.5),
    Dense(1, activation='sigmoid')
])
lstm_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
lstm_model.fit(X_train_seq_balanced, y_train_balanced, epochs=3, batch_size=32, validation_data=(X_val_seq, y_val))
lstm_pred = (lstm_model.predict(X_val_seq) > 0.5).astype(int)
print("\nLSTM Results:")
print("Confusion Matrix:", confusion_matrix(y_val, lstm_pred))
print("Accuracy:", accuracy_score(y_val, lstm_pred))
print("Precision:", precision_score(y_val, lstm_pred))
print("Recall:", recall_score(y_val, lstm_pred))
print("F1-Score:", f1_score(y_val, lstm_pred))
lstm_model.save('models/lstm_model.keras')  # Updated to .keras format

# BERT Model (PyTorch)
class Dataset(torch.utils.data.Dataset):
    def __init__(self, texts, labels, tokenizer, max_len):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts.iloc[idx]
        label = self.labels.iloc[idx]
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

bert_tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
bert_train_dataset = Dataset(X_train, y_train, bert_tokenizer, max_len)
bert_val_dataset = Dataset(X_val, y_val, bert_tokenizer, max_len)

bert_model = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)
training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='./logs',
    logging_steps=10,
    eval_strategy='epoch'  # Updated from evaluation_strategy
)
trainer = Trainer(
    model=bert_model,
    args=training_args,
    train_dataset=bert_train_dataset,
    eval_dataset=bert_val_dataset
)
trainer.train()

# Save BERT model and tokenizer
bert_model.save_pretrained('models/bert_model')
bert_tokenizer.save_pretrained('models/bert_tokenizer')

# Evaluate BERT
bert_val_pred = trainer.predict(bert_val_dataset).predictions.argmax(axis=1)
print("\nBERT Results:")
print("Confusion Matrix:", confusion_matrix(y_val, bert_val_pred))
print("Accuracy:", accuracy_score(y_val, bert_val_pred))
print("Precision:", precision_score(y_val, bert_val_pred))
print("Recall:", recall_score(y_val, bert_val_pred))
print("F1-Score:", f1_score(y_val, bert_val_pred))

# RoBERTa Model (PyTorch)
roberta_tokenizer = RobertaTokenizer.from_pretrained('roberta-base')
roberta_train_dataset = Dataset(X_train, y_train, roberta_tokenizer, max_len)
roberta_val_dataset = Dataset(X_val, y_val, roberta_tokenizer, max_len)

roberta_model = RobertaForSequenceClassification.from_pretrained('roberta-base', num_labels=2)
trainer = Trainer(
    model=roberta_model,
    args=training_args,
    train_dataset=roberta_train_dataset,
    eval_dataset=roberta_val_dataset
)
trainer.train()

# Save RoBERTa model and tokenizer
roberta_model.save_pretrained('models/roberta_model')
roberta_tokenizer.save_pretrained('models/roberta_tokenizer')

# Evaluate RoBERTa
roberta_val_pred = trainer.predict(roberta_val_dataset).predictions.argmax(axis=1)
print("\nRoBERTa Results:")
print("Confusion Matrix:", confusion_matrix(y_val, roberta_val_pred))
print("Accuracy:", accuracy_score(y_val, roberta_val_pred))
print("Precision:", precision_score(y_val, roberta_val_pred))
print("Recall:", recall_score(y_val, roberta_val_pred))
print("F1-Score:", f1_score(y_val, roberta_val_pred))

# Save results to CSV
results = {
    'Model': ['SVM', 'Naïve Bayes', 'CNN', 'LSTM', 'BERT', 'RoBERTa'],
    'Accuracy': [accuracy_score(y_val, svm_pred), accuracy_score(y_val, nb_pred),
                 accuracy_score(y_val, cnn_pred), accuracy_score(y_val, lstm_pred),
                 accuracy_score(y_val, bert_val_pred), accuracy_score(y_val, roberta_val_pred)],
    'Precision': [precision_score(y_val, svm_pred), precision_score(y_val, nb_pred),
                  precision_score(y_val, cnn_pred), precision_score(y_val, lstm_pred),
                  precision_score(y_val, bert_val_pred), precision_score(y_val, roberta_val_pred)],
    'Recall': [recall_score(y_val, svm_pred), recall_score(y_val, nb_pred),
               recall_score(y_val, cnn_pred), recall_score(y_val, lstm_pred),
               recall_score(y_val, bert_val_pred), recall_score(y_val, roberta_val_pred)],
    'F1-Score': [f1_score(y_val, svm_pred), f1_score(y_val, nb_pred),
                 f1_score(y_val, cnn_pred), f1_score(y_val, lstm_pred),
                 f1_score(y_val, bert_val_pred), f1_score(y_val, roberta_val_pred)]
}
results_df = pd.DataFrame(results)
results_df.to_csv('model_results.csv', index=False)
