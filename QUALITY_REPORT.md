# FE Civil Prep: source-key grading expansion

## Scope and current status

- **1,492** source positions from Learnova (1,052 main book + four 110-question companion exams; some overlap).
- **1,492** have A–D automatic answer comparison, increased from 879 (+613).
- Questions and solutions remain available as **2,984 standalone WebP/PNG visuals**, with existing diagrams and source-figure snippets. No original PDF is required to study.
- Custom 1–250 question practice sets, timed exams, subtopic selection, bookmarks, mistake reports, and progress history are preserved.

## Meaning of a correct mark

A match to a publisher answer letter, with documented prior manual corrections, is **not equivalent to independent calculation verification**. The source textbooks contain occasional issues. A–D choices shown on original source images are used for questions whose editable-choice transcription is missing or damaged. **Only 88 previously marked questions had targeted manual checking before this update**, and that count does not increase through key extraction.

## Notable source issues

- Main book #3: the closest printed choice B is about 0.3 m² below the independently computed circular-segment area. This item uses the closest choice with an explanation.
- Main book #68: the meaning of standard deviation is underspecified; both A (population) and D (sample) are accepted.
- Main book #218: printed key contains member-force expressions, but no letter; original 45-degree diagram/choice A was manually matched.
- Main book #156, #219, Exam 2 #21: printer's nonstandard answer-heading formats are recovered.
- Main book #18, #38, #52, #276, #277: previous documented manual answer corrections are preserved.
- Main book #620: source explanation does not match its conceptual answer; refer to the printed source and report concerns.

## Checks run

- Parsed all 1,492 website records and their answer policies; verified all have A–D choices available from text or the source image and a scoring key.
- Compared extracted publisher keys against prior and secondary source parsing; reviewed uncommon key formats.
- Verified all 1,492 source-image mappings and 1,492 solution-image mappings in the website archives.
- Tested representative graded main-book questions and companion-exam questions, multiple-accepted-answer handling, custom timed session scoring, and solution reveal in an isolated Chromium browser.
- Checked JavaScript syntax and the ZIP file inventory. Live GitHub Pages deployment remains untested.

See `AUTO_GRADING_SOURCE_AUDIT.csv` for per-item provenance and exceptions. If an answer is incorrect or ambiguous, use the website Report a problem function.
