import Hero from '../components/Hero.jsx';
import StatsStrip from '../components/StatsStrip.jsx';
import FeatureGrid from '../components/FeatureGrid.jsx';
import SectorsBar from '../components/SectorsBar.jsx';
import ProcessSection from '../components/ProcessSection.jsx';
import CtaBanner from '../components/CtaBanner.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <FeatureGrid />
      <SectorsBar />
      <ProcessSection />
      <CtaBanner />
    </>
  );
}
