import React, { useState, useEffect } from 'react';

// The 12-step action thread showing Hermes' investigation and repair
const ACTION_STEPS = [
  {
    id: 1,
    phase: 'incoming',
    title: 'Request received',
    tool: 'Telegram',
    description: 'Hermes receives incident report via Telegram command',
    details: '/fix_incident - synthetic Flask app with test failures'
  },
  {
    id: 2,
    phase: 'investigation',
    title: 'Repository selected',
    tool: 'file.search',
    description: 'Hermes identifies the target repository and codebase',
    details: 'hermes-synthetic-incident-demo/src/backend/app.py'
  },
  {
    id: 3,
    phase: 'investigation',
    title: 'Baseline inspected',
    tool: 'git.status',
    description: 'Current commit and working tree state analyzed',
    details: 'Base commit: 150fcbf - initial synthetic incident setup'
  },
  {
    id: 4,
    phase: 'analysis',
    title: 'Failure reproduced',
    tool: 'pytest',
    description: 'Test failures identified with specific error messages',
    details: [
      'test_config_data_is_current: AssertionError - port is 3000, expected 5000',
      'test_tickets_route_exists: AssertionError - 404 not found on /tickets',
      'test_audit_entry_created_once: AssertionError - duplicate entries'
    ]
  },
  {
    id: 5,
    phase: 'investigation',
    title: 'Evidence collected',
    tool: 'code.search',
    description: 'Hermes searches source files to locate bug sources',
    details: [
      'grep AUDIT_LOG_FILE found in app.py line 48',
      'grep /tickets route shows only POST handler exists',
      'load_config() not called on each request in get_status()'
    ]
  },
  {
    id: 6,
    phase: 'proposal',
    title: 'Four fixes prepared',
    tool: 'terminal.patch',
    description: 'Proposed changes synthesized from evidence analysis',
    details: [
      'Fix AUDIT_LOG_PATH env var usage (line 48)',
      'Add GET /tickets route handler (lines 123-126)',
      'Remove stale port caching in get_status() (lines 107-115)',
      'Add audit idempotency check to prevent duplicates'
    ]
  },
  {
    id: 7,
    phase: 'approval',
    title: 'Human approval checkpoint',
    tool: 'human.review',
    description: 'Hermes pauses and awaits human confirmation',
    details: 'Review the diff, then approve to apply changes',
    checkpoint: true
  },
  {
    id: 8,
    phase: 'execution',
    title: 'Files changed',
    tool: 'git.apply',
    description: 'Approved fixes applied to source files',
    details: [
      'src/backend/app.py modified',
      '4 functions updated with correct logic'
    ]
  },
  {
    id: 9,
    phase: 'execution',
    title: 'Test suite executed',
    tool: 'pytest',
    description: 'Full test suite runs to verify fixes',
    details: [
      'collected 9 items',
      'tests/integration.py .........'
    ]
  },
  {
    id: 10,
    phase: 'verification',
    title: 'Tests passed',
    tool: 'pytest.result',
    description: 'All test cases pass without regressions',
    details: '9/9 tests passed in 0.68s',
    passed: true
  },
  {
    id: 11,
    phase: 'deployment',
    title: 'Commit created',
    tool: 'git.commit',
    description: 'Verified changes committed to repository',
    details: 'commit 6a3e452 - Fix: Apply synthetic incident fixes'
  },
  {
    id: 12,
    phase: 'verification',
    title: 'Final state verified',
    tool: 'git.status',
    description: 'Repository is clean, changes ready for deploy',
    details: [
      'Status: branch ahead by 1 commit',
      'Files changed: src/backend/app.py (4 fixes)',
      'Ready to push to origin/main'
    ]
  }
];

export default function HermesIncidentReplay() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for user's reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isPlaying || reducedMotion) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % ACTION_STEPS.length);
    }, 3500); // 3.5 seconds per step
    
    return () => clearInterval(interval);
  }, [isPlaying, reducedMotion]);

  const goToStep = (index) => {
    setCurrentStep(index);
    setIsPlaying(false);
  };

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const replay = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };
  const prevStep = () => goToStep((currentStep - 1 + ACTION_STEPS.length) % ACTION_STEPS.length);
  const nextStep = () => goToStep((currentStep + 1) % ACTION_STEPS.length);

  const activeStep = ACTION_STEPS[currentStep];

  // Phase-based styling classes
  const getPhaseClasses = (phase) => {
    switch (phase) {
      case 'incoming': return ['text-cyan', 'bg-cyan/10'];
      case 'investigation': return ['text-blue', 'bg-blue/10'];
      case 'analysis': return ['text-purple', 'bg-purple/10'];
      case 'proposal': return ['text-amber', 'bg-amber/10'];
      case 'approval': return ['text-rose', 'bg-rose/10'];
      case 'execution': return ['text-emerald', 'bg-emerald/10'];
      case 'verification': return ['text-green', 'bg-green/10'];
      case 'deployment': return ['text-sky', 'bg-sky/10'];
      default: return ['text-gray', 'bg-gray/10'];
    }
  };

  const [phaseTextClass, phaseBgClass] = getPhaseClasses(activeStep.phase);

  const completedCount = currentStep;
  const totalCount = ACTION_STEPS.length;
  const progressPercent = ((currentStep + 1) / totalCount) * 100;

  return (
    <section className="hermes-replay" id="hermes-replay">
      <div className="replay-header">
        <h2>A real supervised Hermes run</h2>
        <p className="replay-subtitle">
          This replay shows how Hermes handled a synthetic coding incident from 
          investigation through verified repair. The task used test data and contained 
          no private customer information.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="progress-indicator">
        <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
        <span className="step-count">
          Step {currentStep + 1} of {totalCount}
        </span>
      </div>

      {/* Action thread - horizontal scrollable on mobile, vertical on desktop */}
      <div className="action-thread-container">
        <div className="action-thread">
          {ACTION_STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div
                key={step.id}
                className={`thread-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => goToStep(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && goToStep(index)}
              >
                <div className="node-number">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="node-content">
                  <h4>{step.title}</h4>
                  <div className={`phase-indicator ${phaseTextClass}`}>
                    {step.tool}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="detail-panel">
        <div className={`panel-header ${getPhaseClasses(activeStep.phase)[1]}`}>
          <span className="phase-label">{activeStep.phase.toUpperCase()}</span>
        </div>
        
        <div className="panel-content">
          <h3>{activeStep.title}</h3>
          <p className="step-description">{activeStep.description}</p>
          
          {/* Terminal/File panel */}
          {activeStep.details && (
            <div className="details-panel">
              <h4>Details</h4>
              {Array.isArray(activeStep.details) ? (
                <ul className="detail-list">
                  {activeStep.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
      ) : (
                <p>{activeStep.details}</p>
              )}
            </div>
          )}

          {/* Changed files indicator */}
          {currentStep >= 7 && currentStep < 10 && (
            <div className="changed-files">
              <h4>Files modified</h4>
              <ul>
                <li>src/backend/app.py<span className="status-modified">+23 lines, -15 lines</span></li>
              </ul>
            </div>
          )}

          {/* Test results display */}
          {currentStep >= 9 && (
            <div className="test-results">
              <h4 className={activeStep.passed ? 'tests-passing' : 'tests-failing'}>
                {activeStep.passed ? '✅ All tests passed' : '❌ Tests failing'}
              </h4>
              <pre className="terminal-output">{Array.isArray(activeStep.details) ? activeStep.details.join('\n') : activeStep.details}</pre>
            </div>
          )}

          {/* Approval gate indicator */}
          {currentStep === 6 && (
            <div className="approval-gate">
              <span className="gate-status">⚠ PAUSED - awaiting human approval</span>
              <p className="gate-instruction">Review the diff, then approve to apply changes</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="replay-controls">
        <button onClick={replay} aria-label="Replay from start" className="control-btn" title="Replay">
          <svg viewBox="0 0 24 24"><path d="M4 4v16h3V9l7 5-7 5V4H4z"/></svg>
        </button>
        <button onClick={prevStep} aria-label="Previous step" className="control-btn">
          <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        {isPlaying ? (
          <button onClick={pause} aria-label="Pause" className="control-btn play-pause">
            <svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
          </button>
        ) : (
          <button onClick={play} aria-label="Play" className="control-btn play-pause">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
        )}
        <button onClick={nextStep} aria-label="Next step" className="control-btn">
          <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

      {/* Phase legend */}
      <div className="phase-legend">
        <span className="legend-item"><span className={`dot incoming`} /> Incoming</span>
        <span className="legend-item"><span className={`dot investigation`} /> Investigation</span>
        <span className="legend-item"><span className={`dot analysis`} /> Analysis</span>
        <span className="legend-item"><span className={`dot proposal`} /> Proposal</span>
        <span className="legend-item"><span className={`dot approval`} /> Approval</span>
        <span className="legend-item"><span className={`dot execution`} /> Execution</span>
        <span className="legend-item"><span className={`dot verification`} /> Verification</span>
      </div>
    </section>
  );
}
