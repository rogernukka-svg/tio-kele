'use client';
import SlotMachine from '../../components/SlotMachine';

export default function SlotPage() {
  return (
    <main
      style={{
        background: 'radial-gradient(circle at top, #2B0A4D, #140622)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SlotMachine />
    </main>
  );
}
