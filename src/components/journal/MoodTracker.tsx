import React from 'react';
import '../../styles/journal.css';

type Mood = "confident" | "uncertain" | "fearful" | "greedy" | "neutral" | "disciplined";

interface MoodTrackerProps {
  selectedMood?: Mood;
  onMoodChange: (mood: Mood) => void;
}

const moods: { value: Mood; label: string; emoji: string; color: string }[] = [
  { value: "confident", label: "Confident", emoji: "😎", color: "#10b981" },
  { value: "disciplined", label: "Disciplined", emoji: "🎯", color: "#3b82f6" },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "#6b7280" },
  { value: "uncertain", label: "Uncertain", emoji: "🤔", color: "#f59e0b" },
  { value: "fearful", label: "Fearful", emoji: "😰", color: "#ef4444" },
  { value: "greedy", label: "Greedy", emoji: "🤑", color: "#8b5cf6" },
];

const MoodTracker: React.FC<MoodTrackerProps> = ({ selectedMood, onMoodChange }) => {
  return (
    <div className="mood-tracker">
      <label className="mood-label">How did you feel during this trade?</label>
      <div className="mood-grid">
        {moods.map((mood) => (
          <button
            key={mood.value}
            type="button"
            className={`mood-button ${selectedMood === mood.value ? 'selected' : ''}`}
            onClick={() => onMoodChange(mood.value)}
            style={{
              borderColor: selectedMood === mood.value ? mood.color : 'transparent',
              backgroundColor: selectedMood === mood.value ? `${mood.color}20` : 'transparent'
            }}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-name">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodTracker;
