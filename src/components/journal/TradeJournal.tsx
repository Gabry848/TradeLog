import React, { useState } from 'react';
import MoodTracker from './MoodTracker';
import '../../styles/journal.css';

type Mood = "confident" | "uncertain" | "fearful" | "greedy" | "neutral" | "disciplined";

interface TradeJournalProps {
  preTradeNotes?: string;
  postTradeNotes?: string;
  mood?: Mood;
  screenshots?: string[];
  onPreTradeNotesChange: (notes: string) => void;
  onPostTradeNotesChange: (notes: string) => void;
  onMoodChange: (mood: Mood) => void;
  onScreenshotsChange: (screenshots: string[]) => void;
  isClosedTrade?: boolean;
}

const TradeJournal: React.FC<TradeJournalProps> = ({
  preTradeNotes = '',
  postTradeNotes = '',
  mood,
  screenshots = [],
  onPreTradeNotesChange,
  onPostTradeNotesChange,
  onMoodChange,
  onScreenshotsChange,
  isClosedTrade = false
}) => {
  const [activeTab, setActiveTab] = useState<'pre' | 'post'>('pre');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const readers = fileArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(base64Images => {
      onScreenshotsChange([...screenshots, ...base64Images]);
    });
  };

  const removeScreenshot = (index: number) => {
    const newScreenshots = screenshots.filter((_, i) => i !== index);
    onScreenshotsChange(newScreenshots);
  };

  return (
    <div className="trade-journal">
      <div className="journal-tabs">
        <button
          type="button"
          className={`journal-tab ${activeTab === 'pre' ? 'active' : ''}`}
          onClick={() => setActiveTab('pre')}
        >
          📝 Pre-Trade Analysis
        </button>
        {isClosedTrade && (
          <button
            type="button"
            className={`journal-tab ${activeTab === 'post' ? 'active' : ''}`}
            onClick={() => setActiveTab('post')}
          >
            📊 Post-Trade Review
          </button>
        )}
      </div>

      <div className="journal-content">
        {activeTab === 'pre' && (
          <div className="journal-section">
            <label>Pre-Trade Notes</label>
            <textarea
              className="journal-textarea"
              placeholder="Why am I entering this trade? What's my analysis? What are the key levels?"
              value={preTradeNotes}
              onChange={(e) => onPreTradeNotesChange(e.target.value)}
              rows={6}
            />
            <div className="journal-prompts">
              <small>💡 Consider documenting:</small>
              <ul>
                <li>Market conditions and trend direction</li>
                <li>Entry reason (setup, pattern, signal)</li>
                <li>Key support/resistance levels</li>
                <li>Risk/reward ratio calculation</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'post' && isClosedTrade && (
          <div className="journal-section">
            <label>Post-Trade Notes</label>
            <textarea
              className="journal-textarea"
              placeholder="What went well? What could be improved? Did I follow my plan?"
              value={postTradeNotes}
              onChange={(e) => onPostTradeNotesChange(e.target.value)}
              rows={6}
            />
            <div className="journal-prompts">
              <small>💡 Consider documenting:</small>
              <ul>
                <li>Did the trade go as expected?</li>
                <li>Did I follow my trading plan?</li>
                <li>What emotions did I experience?</li>
                <li>What would I do differently next time?</li>
              </ul>
            </div>

            <MoodTracker selectedMood={mood} onMoodChange={onMoodChange} />
          </div>
        )}

        <div className="screenshots-section">
          <label>Screenshots & Charts</label>
          <div className="screenshots-grid">
            {screenshots.map((screenshot, index) => (
              <div key={index} className="screenshot-item">
                <img src={screenshot} alt={`Screenshot ${index + 1}`} />
                <button
                  type="button"
                  className="remove-screenshot"
                  onClick={() => removeScreenshot(index)}
                  title="Remove screenshot"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <label className="upload-button">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            📸 Add Screenshot
          </label>
        </div>
      </div>
    </div>
  );
};

export default TradeJournal;
