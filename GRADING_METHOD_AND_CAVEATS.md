# FE Civil Prep: auto-grading expansion and source-key audit

This update retains **1,492** indexed Learnova positions and the existing standalone question/solution visuals. It adds **613** previously ungraded items to A–D source-key comparison: **173** main-book questions and **440** companion-exam questions. All **1,492** are now automatically compared to a defined answer policy. This does **not** establish that all answers are mathematically correct.

## What grading means

- The learner selects an A–D letter from the choices visible on each original question image.
- A score is calculated against the publisher's printed answer key, except for five previously documented manual corrections and two special cases.
- For companion exams, option text is **not retyped from the PDF**; the original printed choice image is shown, and the A–D buttons correspond to the printed choice letters. This avoids silently misrendering fractions and diagrams.
- Existing bookmarks, practice customization, subject rotation, diagrams, source images and progress storage remain. An earlier ungraded saved response is now compared with the source key when reopened.

## High-impact exceptions (shown in the question solution)

- Learnova #3: computed circular-segment area for radius 10 m and 16 m chord is approximately **44.73 m²**. The closest offered choice is B (44.43 m²); it is scored as the closest printed value. The discrepancy is documented.
- Learnova #68: population standard deviation is approximately **1.41 kg (A)**, while sample standard deviation is approximately **1.58 kg (D)**. Because the question does not specify which convention, **A and D** are both accepted.
- Learnova #218: source's answer label is omitted, but source solution and the 45° member diagram give **BC=√2·W, AC=W**, matching printed option **A**.
- Learnova #156: publisher mistakenly prints "Correct Problem: (B)" instead of "Correct Answer"; B is the stated source solution.
- Learnova Exam 2 #21 and main book #219: source prints "Correct Answer: (B.)", which the older parser missed.
- Learnova #620: source key B and urban-runoff question align, but publisher's explanation discusses a different control technique. It remains an editorial issue.
- Prior reviewed corrections for main-book questions **18, 38, 52, 276, 277** are preserved, even though some conflict with printed source letters.

## Validation levels

- This is **publisher-answer-key comparison**, not independent solution verification.
- Source-key provenance and original page references are recorded per question in `AUTO_GRADING_SOURCE_AUDIT.csv`.
- Previous independent manual checks apply only to their originally documented questions; nothing is newly labeled independently verified by this automation.
- The number of correct answers on these source-book items is **not** a calibrated estimate of NCEES FE performance.

## Technical checks

- 1,492 records structurally checked, with no missing scoring key.
- 613 previously ungraded items enabled; source-key evidence and special policies traced.
- 440 companion images preserve original options and publisher worked solutions.
- ZIP contents include only ordinary website files and review docs (no nested ZIPs, no PDF files).
