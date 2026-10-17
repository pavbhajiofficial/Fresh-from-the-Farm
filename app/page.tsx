import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sketch from '@/components/Sketch';
import { Featured, HeroSearch } from '@/components/LandingClient';

const STEPS = [
  ['Browse or list', 'Buyers filter by price and place. Farmers list a harvest in minutes.'],
  ['Order direct', 'Buyers order and farmers confirm availability. No middlemen.'],
  ['Track it', 'Follow every order from placed to completed.'],
];

export default function Landing() {
  return (
    <>
      <Header />
      <section className="hero">
        <div className="wrap in">
          <div className="bigword">fresh from the farm</div>
          <div className="tagline">FAIR FOR EVERYONE</div>
          <p>Good food starts with good connections. Discover fresh produce straight from farmers.</p>
          <HeroSearch />
        </div>
        <span className="sk" style={{ left: '3%', top: '50%', transform: 'rotate(-6deg)' }}><Sketch name="wheat" /></span>
        <span className="sk" style={{ left: '16%', top: '62%', transform: 'rotate(6deg)' }}><Sketch name="tomato" /></span>
        <span className="sk" style={{ left: '74%', top: '60%', transform: 'rotate(-8deg)' }}><Sketch name="carrot" /></span>
        <span className="sk" style={{ left: '86%', top: '48%', transform: 'rotate(8deg)' }}><Sketch name="sprig" /></span>
      </section>
      <div className="marq"><span>{'fair for everyone ✿ direct from farmers ✿ clear prices ✿ '.repeat(12)}</span></div>
      <section className="blk"><div className="wrap"><h2>Fresh this week</h2><Featured /></div></section>
      <section className="blk" id="how" style={{ background: 'var(--card)', borderBlock: '1.5px solid var(--dk)' }}>
        <div className="wrap" style={{ position: 'relative' }}>
          <span className="sk" style={{ right: '4%', top: -60 }}><Sketch name="wheat" /></span>
          <h2>How it works</h2>
          <div className="grid g3">{STEPS.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>
        </div>
      </section>
      <Footer />
    </>
  );
}
