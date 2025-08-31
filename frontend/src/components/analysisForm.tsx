import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

interface PredictionResult {
  text: string;
  predictions: { [model: string]: string };
  probabilities: { [model: string]: number };
}

const AnalysisForm: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [results, setResults] = useState<PredictionResult | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const user = useUser();
  const maxLength = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast({
        title: 'Empty Text',
        description: 'Please enter some text to analyze.',
        variant: 'destructive',
      });
      return;
    }
    if (text.length > maxLength) {
      toast({
        title: 'Text Too Long',
        description: `Text must be ${maxLength} characters or less.`,
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (user) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      }

      const response = await fetch('http://127.0.0.1:5000/api/predict', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (response.ok) {
        setResults(data);
        toast({
          title: 'Analysis Complete',
          description: user
            ? 'Results are displayed below and saved to your history.'
            : 'Results are displayed below. Log in to save predictions.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Analysis Failed',
          description: data.error || 'Failed to analyze text.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Error connecting to backend: ' + err.message,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getModelExplanation = (model: string, prediction: string): string => {
    if (prediction === 'Cyberbullying') {
      if (['bert', 'roberta'].includes(model)) {
        return 'Detected contextual negative sentiment or abusive patterns.';
      }
      if (['svm', 'naive_bayes'].includes(model)) {
        return 'Identified keywords or phrases associated with bullying.';
      }
      if (['cnn', 'lstm'].includes(model)) {
        return 'Recognized sequential patterns indicating harmful intent.';
      }
    }
    return 'No bullying patterns detected.';
  };

  const resetForm = () => {
    setText('');
    setResults(null);
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-800 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter or paste text to analyze for cyberbullying content..."
              className="min-h-[150px] border-cybersafe-200 focus-visible:ring-cybersafe-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              maxLength={maxLength}
              aria-label="Text input for cyberbullying analysis"
            />
            <div className="absolute bottom-2 right-2 text-sm text-gray-500 dark:text-gray-400">
              {text.length}/{maxLength}
            </div>
          </div>
          <Button
            type="submit"
            disabled={isAnalyzing}
            className="w-auto mx-auto block bg-cybersafe-600 hover:bg-cybersafe-700 text-white rounded-lg hover:scale-105 transition-transform duration-200 disabled:bg-cybersafe-400"
            aria-label="Analyze text for cyberbullying"
          >
            {isAnalyzing ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                  />
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze Text'
            )}
          </Button>
        </form>

        {results && (
          <Card
            className="mt-8 overflow-hidden border-t-4 animate-in fade-in slide-in-from-top-5 duration-300 bg-white dark:bg-gray-800 shadow-lg"
            style={{
              borderTopColor:
                Object.values(results.predictions).filter((p) => p === 'Cyberbullying').length >= 3
                  ? '#ef4444'
                  : '#10b981',
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {Object.values(results.predictions).filter((p) => p === 'Cyberbullying').length >= 3
                    ? 'Cyberbullying Detected'
                    : 'No Cyberbullying Detected'}
                </h3>
                <div
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    backgroundColor:
                      Object.values(results.predictions).filter((p) => p === 'Cyberbullying').length >= 3
                        ? '#fee2e2'
                        : '#d1fae5',
                    color:
                      Object.values(results.predictions).filter((p) => p === 'Cyberbullying').length >= 3
                        ? '#b91c1c'
                        : '#047857',
                  }}
                >
                  {Math.round(
                    (Object.values(results.probabilities).reduce((a, b) => a + b, 0) /
                      Object.values(results.probabilities).length) *
                      100
                  )}% confidence
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">Input Text: {results.text}</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.keys(results.predictions).map((model) => (
                  <div key={model} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md shadow">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">{model.toUpperCase()}</h4>
                    <p
                      className={`text-${
                        results.predictions[model] === 'Cyberbullying' ? 'red' : 'green'
                      }-600 dark:text-${
                        results.predictions[model] === 'Cyberbullying' ? 'red' : 'green'
                      }-400`}
                    >
                      {results.predictions[model]}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Confidence: {(results.probabilities[model] * 100).toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getModelExplanation(model, results.predictions[model])}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex space-x-4">
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-auto px-4 py-2 border-cybersafe-200 hover:bg-cybersafe-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  aria-label="Clear form and analyze again"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => navigate('/dashboard', { state: { result: results } })}
                  className="w-auto px-4 py-2 bg-cybersafe-600 hover:bg-cybersafe-700 text-white rounded-lg hover:scale-105 transition-transform duration-200"
                  aria-label="View prediction history dashboard"
                >
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnalysisForm;