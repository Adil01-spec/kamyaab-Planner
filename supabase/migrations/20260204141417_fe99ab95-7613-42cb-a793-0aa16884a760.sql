-- Add optional advisor observation column for strategic mentor insights
ALTER TABLE review_feedback 
ADD COLUMN IF NOT EXISTS advisor_observation text;