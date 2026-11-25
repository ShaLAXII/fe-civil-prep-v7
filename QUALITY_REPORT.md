# FE Civil Prep - 1,492-Position Standalone Visual Edition

## What this build contains

- Learnova main book: 1,052 indexed question positions.
- Learnova companion examinations 1-4: 110 positions each (440 total). Some companion questions repeat problems in the main book.
- 1,492 standalone question visuals and **1,492** standalone worked-solution visuals, reconstructed as cropped WebP assets from the actual supplied book pages. No external PDFs are needed to read these in the browser.
- 224 separately extracted figure assets from relevant source-question regions, plus 42 preexisting SVG diagrams reconstructed for question cards. Including text-context prompts, 266 distinct question cards are automatically recognized as needing prominent visual treatment. The 42 SVG redraws do not independently establish that every dimension is correct.
- Main website features retained: one question at a time, custom question counts/time limits, subject and source selection, timed exams, bookmarked questions, progress, reporting, and individual question export.

## What the comprehensive automated audit actually checked

The machine processing loop visited **every one of the 1,492 question records** and attempted each item listed below.

1. Checked original source-document page mappings and solution-page mappings against the supplied PDFs.
2. Generated and decoded one WebP question asset and one WebP solution asset for every indexed item. All **2,984** passed image integrity verification.
3. Checked each displayed question/solution crop for numbered headings and obvious leakage from the next numbered item. No next-question heading leakage was detected. The printed number for companion exam 1, problem 8 was not recognized by text search, but its image was visually inspected and includes the correct heading, drawing and choices.
4. Ran the source-answer-heading extraction across every item's solution. **1,488 of 1,492** answer letters were machine-detected; **four** remain unparsed. This is a comparison to publisher-provided answers, **not** an independent derivation.
5. Found five publisher-letter vs website-key differences: main-book problems **18, 38, 52, 276, and 277**. These were previously manually reviewed and their corrected website answers were retained. Check the worked steps for any consequential use.
6. Checked basic field structure, question/solution-image presence, review-state flags, four-choice availability, and machine-scoring eligibility on each record.
7. Tested representative source-cropped diagrams, tables, multi-page questions, worked solutions and navigation in isolated desktop/mobile Chromium sessions.

## Important limits - do not mistake automated audit for professional review

- **88 main-book questions** were tagged as previously manually checked before this build. The remaining items were **not all independently re-solved or professionally peer reviewed**. The website does not claim that they were.
- **879 questions** retain source-key automatic scoring. A source-key comparison is **not** proof that the publisher's calculation is correct.
- **613 questions** remain ungraded when source answers or reconstructed choices cannot be scored confidently (including the 440 companion-exam entries). Their original options and worked solutions are readable in the standalone images.
- Some calculations, diagrams and original source answers contain possible publisher errors; no software can guarantee zero mistakes from automated extraction or OCR/transcription alone.
- Some extracted figures are **source-matched raster snippets**, not mathematically reconstructed vector drawings. This avoids guessing geometry but does not meet a requirement that every source figure be independently redrawn by hand.
- Source excerpts are separate image assets, not a PDF viewer or infinite-scroll feed. Longer questions still use normal page scrolling when necessary.
- The live GitHub Pages deployment has not yet been tested. The browser tests were run with site scripts loaded into an isolated Chromium page; lazy-loading file references were also checked statically.

## Auditable outputs

- `FULL_1492_AUTOMATED_REVIEW.csv`: every question's status, field checks, figure attachment and image completeness.
- `SOURCE_BOUNDARY_AUDIT.csv`: each question and solution crop mapping and boundary results.
- `PUBLISHER_KEY_COMPARISON.csv`: publisher-letter extraction and comparison with the website's letter.

If a numbered problem is essential for exam preparation, compare the visible solution against the FE handbook and flag any disagreement using the website's Report function. For official exam readiness, use the official NCEES practice exam as a separate benchmark.
