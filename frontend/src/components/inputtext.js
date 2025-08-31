    import { useState } from 'react';
    import { useSupabaseClient } from '@supabase/auth-helpers-react';
    import { Button } from './ui/button';
    import { Textarea } from './ui/textarea';
    import { Card, CardContent } from './ui/card';
    import { useToast } from './ui/use-toast';

    const AnalysisForm = () => {
      const [text, setText] = useState('');
      const [isAnalyzing, setIsAnalyzing] = useState(false);
      const [results, setResults] = useState(null);
      const { toast } = useToast();
      const supabase = useSupabaseClient();

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) {
          toast({
            title: "Empty Text",
            description: "Please enter some text to analyze.",
            variant: "destructive",
          });
          return;
        }

        setIsAnalyzing(true);
        try {
          // Initialize headers
          const headers = {
            'Content-Type': 'application/json',
          };

          // Attempt to get user, but proceed if it fails
          let user = null;
          try {
            const { data } = await supabase.auth.getUser();
            user = data?.user || null;
            if (user) {
              headers['Authorization'] = `Bearer ${user.token.access_token}`;
            }
          } catch (authError) {
            console.warn('Supabase auth error, proceeding anonymously:', authError.message);
            // Continue without user
          }

          const response = await fetch('http://127.0.0.1:5000/api/predict', {
            method: 'POST',
            headers,
            body: JSON.stringify({ text }),
          });

          const data = await response.json();
          if (response.ok) {
            setResults(data);
            if (!user) {
              toast({
                title: "Analysis Complete",
                description: "Log in to save your results and view your report dashboard.",
                variant: "default",
              });
            }
          } else {
            toast({
              title: "Analysis Failed",
              description: data.error || 'Failed to analyze text.',
              variant: "destructive",
            });
          }
        } catch (err) {
          toast({
            title: "Error",
            description: 'Error connecting to backend: ' + err.message,
            variant: "destructive",
          });
        } finally {
          setIsAnalyzing(false);
        }
      };

      return (
        <div className="max-w-3xl mx-auto px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter or paste text to analyze for cyberbullying content..."
              className="min-h-[150px] border-cybersafe-200 focus-visible:ring-cybersafe-500"
            />
            <Button
              type="submit"
              disabled={isAnalyzing}
              className="w-auto mx-auto block bg-cybersafe-600 hover:bg-cybersafe-700 text-white"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
            </Button>
          </form>

          {results && (
            <Card
              className="mt-8 overflow-hidden border-t-4 animate-in fade-in slide-in-from-top-5 duration-300"
              style={{
                borderTopColor:
                  Object.values(results.predictions).filter((p) => p === 'Cyberbullying').length >= 3
                    ? '#ef4444'
                    : '#10b981',
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {Object.values(results.predictions).filter((p) => p === 'Cyberbullying').length >= 3
                      ? 'Potential Cyberbullying Detected'
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
                        Object.values(results.probabilities).length) * 100
                    )}% confidence
                  </div>
                </div>
                <p className="text-gray-700">Input Text: {results.text}</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {Object.keys(results.predictions).map((model) => (
                    <div key={model} className="p-4 bg-white rounded-md shadow">
                      <h4 className="font-bold text-gray-800">{model.toUpperCase()}</h4>
                      <p
                        className={`text-${
                          results.predictions[model] === 'Cyberbullying' ? 'red' : 'green'
                        }-600`}
                      >
                        {results.predictions[model]}
                      </p>
                      <p>Confidence: {(results.probabilities[model] * 100).toFixed(2)}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    };

    export default AnalysisForm;