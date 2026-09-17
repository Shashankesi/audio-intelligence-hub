# Summary Accuracy Graph

## Goal
Add a clear accuracy graph to each meeting summary without inventing scores.

## Changes
- Add an **Accuracy** tab on the meeting summary page.
- Compare the generated summary with its saved ground-truth reference using real ROUGE-1, ROUGE-2, and ROUGE-L scores.
- Show the three percentage scores in a responsive chart with an explanation of what they measure.
- When no reference summary exists, show a direct link to Benchmarks so the user can add ground truth and run a valid comparison.

## Technical details
- Reuse the existing summary evaluation functions so results match the Benchmarks page.
- Read only the reference associated with the current recording.
- Keep AI confidence separate from accuracy because confidence is not a verified evaluation score.
