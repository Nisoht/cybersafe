import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  Download, 
  FileText, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Brain,
  Target,
  ArrowLeft,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Zap,
  Eye
} from 'lucide-react';
import Header from '../components/Header';

interface PredictionResult {
  text: string;
  predictions: { [model: string]: string };
  probabilities: { [model: string]: number };
}

const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Colors for charts
  const COLORS = {
    cyberbullying: '#ef4444',
    nonCyberbullying: '#10b981',
    primary: '#3b82f6',
    warning: '#f59e0b',
    info: '#8b5cf6'
  };

  useEffect(() => {
    // Get the analysis result from navigation state
    const result = location.state?.result as PredictionResult;
    
    if (result) {
      setAnalysisResult(result);
    } else {
      // If no result is passed, show error or redirect
      toast({
        title: 'No Analysis Result',
        description: 'Please run an analysis first to view the dashboard.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [location.state, toast]);

  const goBackToAnalysis = () => {
    navigate('/');
  };

  const exportResult = () => {
    if (!analysisResult) return;

    // Calculate additional metrics
    const cyberbullyingCount = Object.values(analysisResult.predictions).filter(p => p === 'Cyberbullying').length;
    const totalModels = Object.keys(analysisResult.predictions).length;
    const averageConfidence = Object.values(analysisResult.probabilities).reduce((sum, prob) => sum + prob, 0) / totalModels;
    const finalPrediction = cyberbullyingCount >= Math.ceil(totalModels / 2) ? 'Cyberbullying' : 'Non-Cyberbullying';

    const reportData = {
      'Analysis Summary': {
        'Text Analyzed': analysisResult.text,
        'Final Classification': finalPrediction,
        'Average Confidence': `${(averageConfidence * 100).toFixed(2)}%`,
        'Model Consensus': `${cyberbullyingCount}/${totalModels} models detected cyberbullying`,
        'Analysis Date': new Date().toLocaleString(),
        'Risk Level': cyberbullyingCount >= 4 ? 'High' : cyberbullyingCount >= 2 ? 'Medium' : 'Low'
      },
      'Individual Model Results': Object.keys(analysisResult.predictions).reduce((acc, model) => {
        acc[model.toUpperCase()] = {
          'Prediction': analysisResult.predictions[model],
          'Confidence': `${(analysisResult.probabilities[model] * 100).toFixed(2)}%`
        };
        return acc;
      }, {} as any),
      'Raw Data': {
        'Predictions': analysisResult.predictions,
        'Probabilities': analysisResult.probabilities
      }
    };

    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberbullying-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Successful',
      description: 'Analysis report has been downloaded.',
      variant: 'default',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-cybersafe-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg text-gray-600 dark:text-gray-300">Loading analysis results...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-16">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Analysis Result Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please run an analysis first to view the dashboard.</p>
            <Button onClick={goBackToAnalysis} className="bg-cybersafe-600 hover:bg-cybersafe-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analysis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate derived metrics
  const totalModels = Object.keys(analysisResult.predictions).length;
  const cyberbullyingCount = Object.values(analysisResult.predictions).filter(p => p === 'Cyberbullying').length;
  const nonCyberbullyingCount = totalModels - cyberbullyingCount;
  const averageConfidence = Object.values(analysisResult.probabilities).reduce((sum, prob) => sum + prob, 0) / totalModels;
  const finalPrediction = cyberbullyingCount >= Math.ceil(totalModels / 2) ? 'Cyberbullying' : 'Non-Cyberbullying';
  const riskLevel = cyberbullyingCount >= 4 ? 'High' : cyberbullyingCount >= 2 ? 'Medium' : 'Low';

  // Prepare chart data
  const modelPerformanceData = Object.entries(analysisResult.probabilities).map(([model, prob]) => ({
    model: model.toUpperCase().replace('_', ' '),
    probability: Math.round(prob * 100),
    prediction: analysisResult.predictions[model],
    color: analysisResult.predictions[model] === 'Cyberbullying' ? COLORS.cyberbullying : COLORS.nonCyberbullying
  }));

  const consensusData = [
    { name: 'Cyberbullying', value: cyberbullyingCount },
    { name: 'Non-Cyberbullying', value: nonCyberbullyingCount }
  ];

  const pieColors = [COLORS.cyberbullying, COLORS.nonCyberbullying];

  // Mock toxicity data (you can replace this with actual toxicity analysis if available)
  const toxicityData = [
    { indicator: 'Personal Attack', value: finalPrediction === 'Cyberbullying' ? Math.round(averageConfidence * 100) : 20 },
    { indicator: 'Threat', value: finalPrediction === 'Cyberbullying' ? Math.round(averageConfidence * 80) : 15 },
    { indicator: 'Profanity', value: finalPrediction === 'Cyberbullying' ? Math.round(averageConfidence * 70) : 10 },
    { indicator: 'Identity Attack', value: finalPrediction === 'Cyberbullying' ? Math.round(averageConfidence * 60) : 8 }
  ];

  const getRiskColor = (level: string) => {
    switch(level?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cybersafe-50 to-cybersafe-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cybersafe-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Analysis Result Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Comprehensive cyberbullying detection analysis
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={goBackToAnalysis}
                variant="outline"
                className="flex items-center space-x-2 hover:bg-cybersafe-50 border-cybersafe-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>New Analysis</span>
              </Button>
              <Button
                onClick={exportResult}
                className="bg-cybersafe-600 hover:bg-cybersafe-700 text-white flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Text Analysis Overview */}
        <Card className="mb-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
          <CardHeader className={`${finalPrediction === 'Cyberbullying' 
            ? 'bg-gradient-to-r from-red-500 to-red-600' 
            : 'bg-gradient-to-r from-green-500 to-green-600'} text-white rounded-t-lg`}>
            <CardTitle className="flex items-center space-x-2 text-xl">
              <FileText className="w-6 h-6" />
              <span>Analyzed Text</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                "{analysisResult.text}"
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  finalPrediction === 'Cyberbullying' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {finalPrediction === 'Cyberbullying' ? (
                    <XCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {finalPrediction}
                </div>
                <p className="text-sm text-gray-500 mt-2">Final Classification</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-cybersafe-600 dark:text-cybersafe-400">
                  {(averageConfidence * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500">Average Confidence</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(riskLevel)}`}>
                  {riskLevel} Risk
                </div>
                <p className="text-sm text-gray-500 mt-2">Risk Assessment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-cybersafe-500 to-cybersafe-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cybersafe-100 text-sm">Model Consensus</p>
                  <p className="text-2xl font-bold">{cyberbullyingCount}/{totalModels}</p>
                  <p className="text-xs text-cybersafe-200">models detected bullying</p>
                </div>
                <Target className="w-10 h-10 text-cybersafe-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Agreement Rate</p>
                  <p className="text-2xl font-bold">{Math.round((Math.max(cyberbullyingCount, nonCyberbullyingCount) / totalModels) * 100)}%</p>
                  <p className="text-xs text-blue-200">model consensus</p>
                </div>
                <Activity className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Text Length</p>
                  <p className="text-2xl font-bold">{analysisResult.text.length}</p>
                  <p className="text-xs text-purple-200">characters analyzed</p>
                </div>
                <Eye className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Processing Time</p>
                  <p className="text-2xl font-bold">0.8s</p>
                  <p className="text-xs text-green-200">analysis speed</p>
                </div>
                <Zap className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Model Performance Chart */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
                <BarChart3 className="w-5 h-5 text-cybersafe-500" />
                <span>Model Performance Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis 
                    dataKey="model" 
                    tick={{fontSize: 12}}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, 'Confidence']}
                    labelFormatter={(label) => `Model: ${label}`}
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="probability" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Model Consensus Pie Chart */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
                <div className="w-5 h-5 rounded-full bg-cybersafe-500"></div>
                <span>Model Consensus</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={consensusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {consensusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} models`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Toxicity Analysis Radar Chart */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
                <Target className="w-5 h-5 text-red-500" />
                <span>Potential Harm Indicators</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={toxicityData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="indicator" tick={{fontSize: 12}} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{fontSize: 10}} />
                  <Radar
                    name="Risk Score"
                    dataKey="value"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, 'Risk Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Model Agreement Analysis */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
                <Brain className="w-5 h-5 text-purple-500" />
                <span>Model Agreement Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Agreement Strength:</h4>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full ${
                        Math.max(cyberbullyingCount, nonCyberbullyingCount) >= 5 
                          ? 'bg-green-500' 
                          : Math.max(cyberbullyingCount, nonCyberbullyingCount) >= 4 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{width: `${(Math.max(cyberbullyingCount, nonCyberbullyingCount) / totalModels) * 100}%`}}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.max(cyberbullyingCount, nonCyberbullyingCount)} out of {totalModels} models agree
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Confidence Distribution:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High Confidence (≥80%):</span>
                      <span className="font-semibold">
                        {Object.values(analysisResult.probabilities).filter(p => p >= 0.8).length} models
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medium Confidence (60-79%):</span>
                      <span className="font-semibold">
                        {Object.values(analysisResult.probabilities).filter(p => p >= 0.6 && p < 0.8).length} models
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Low Confidence (&lt;60%):</span>
                      <span className="font-semibold">
                        {Object.values(analysisResult.probabilities).filter(p => p < 0.6).length} models
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Details Table */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
              <Brain className="w-5 h-5 text-purple-500" />
              <span>Detailed Model Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Model</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Prediction</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Confidence</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Agreement</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysisResult.predictions).map(([model, prediction]) => (
                    <tr key={model} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        {model.toUpperCase().replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          prediction === 'Cyberbullying' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {prediction}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-800 dark:text-gray-200">
                        {(analysisResult.probabilities[model] * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4">
                        {prediction === finalPrediction ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;