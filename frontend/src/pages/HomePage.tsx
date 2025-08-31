import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import AnalysisForm from '../components/analysisForm';
import Footer from '../components/footer';



const HomePage = () => {
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AnalysisForm />
      </main>
      <Footer />
    </div>
  );
};
export default HomePage;