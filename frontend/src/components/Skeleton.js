import React from 'react';

const pulse = `
@keyframes sn-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
`;

function SkeletonBox({ width = '100%', height = '16px', radius = '6px', style = {} }) {
  return (
    <>
      <style>{pulse}</style>
      <div style={{
        width, height, borderRadius: radius,
        background: 'linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%)',
        animation: 'sn-pulse 1.4s ease-in-out infinite',
        ...style
      }} />
    </>
  );
}

export function GameCardSkeleton() {
  return (
    <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem', borderLeft: '4px solid #222' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1 }}><SkeletonBox height='14px' width='70%' /></div>
        <SkeletonBox width='60px' height='28px' radius='8px' />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}><SkeletonBox height='14px' width='70%' /></div>
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
        <SkeletonBox width='120px' height='10px' />
      </div>
      <div style={{ marginTop: '0.8rem' }}><SkeletonBox height='20px' radius='6px' /></div>
    </div>
  );
}

export function TableRowSkeleton({ rows = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0' }}>
          <SkeletonBox width='24px' height='14px' style={{ flexShrink: 0 }} />
          <SkeletonBox width='24px' height='24px' radius='50%' style={{ flexShrink: 0 }} />
          <SkeletonBox width='40%' height='14px' />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            {[40, 30, 30, 30].map((w, j) => <SkeletonBox key={j} width={`${w}px`} height='14px' />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScorersSkeleton({ rows = 10 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid #111' }}>
          <SkeletonBox width='28px' height='14px' style={{ flexShrink: 0 }} />
          <SkeletonBox width='45%' height='14px' />
          <SkeletonBox width='25%' height='12px' />
          <div style={{ marginLeft: 'auto' }}><SkeletonBox width='30px' height='20px' /></div>
        </div>
      ))}
    </div>
  );
}

export function TeamCardSkeleton({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: '#1a1a1a', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
          <SkeletonBox width='50px' height='50px' radius='50%' style={{ margin: '0 auto 0.5rem' }} />
          <SkeletonBox width='80%' height='12px' style={{ margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
}

export default SkeletonBox;
