# Daily Inspection Draft Feature Guide

## Overview
The Daily Inspection module now supports saving incomplete forms as drafts, allowing users to resume editing at any time before final submission.

## How to Use

### Saving as Draft

1. **While Filling Out the Form:**
   - Start filling out any step of the Daily Inspection form
   - At any point, click the **"Save as Draft"** button
   - You'll see a confirmation: "Draft saved successfully! You can continue editing or submit it later."
   - Your draftId is automatically tracked for future edits

2. **Automatic Draft Saving:**
   - Drafts are automatically saved when you click "Next" to proceed to the next step
   - This ensures you don't lose progress between steps

### Resuming a Draft

1. **From the Inspections List:**
   - Navigate to the "Submitted Inspections" section
   - Look for inspections with status **"📝 Draft"**
   - Click the **"Resume Draft"** button
   - The form will load with your previously saved data
   - Continue editing from where you left off

2. **Status Indicators:**
   - **📝 Draft** (Yellow badge) - Unsaved/incomplete inspection
   - **✓ Submitted** (Green badge) - Completed and submitted inspection

### Submitting a Draft

1. **Complete All Steps:**
   - Use "Next" button to navigate through all 4 steps
   - On the final step (Step 4), the "Submit All" button appears

2. **Submit the Inspection:**
   - Review your entries for accuracy
   - Click **"Submit All"** button
   - Confirm the submission when prompted
   - Your inspection status will change from Draft to Submitted

## Features

✅ **Multiple Save Points:** Save as draft at any step, not just after completing the form

✅ **Data Persistence:** Your draft data is saved to the database and persists across browser sessions

✅ **Clear Status:** Easily identify drafts vs. submitted inspections in the list

✅ **Easy Resume:** One-click button to resume editing your draft

✅ **Automatic Step-Saves:** Drafts are automatically saved when navigating between steps

## Technical Details

- Drafts are stored in the DailyInspection database with status: ['Draft']
- Each user can only see and edit their own drafts
- Admins can view all users' drafts
- Draft data is automatically cleared when the inspection is submitted
- All form sections (External Assets, Ground Floor, First Floor, Second Floor) are saved

## Troubleshooting

**Q: I saved a draft but don't see it in the list?**
- Refresh the page to reload the inspections list
- Make sure you're logged in with the same user account

**Q: Can I have multiple drafts?**
- Yes! Each time you click "Save as Draft", a new draft is created or the existing one is updated

**Q: What happens to my draft after I submit?**
- Once submitted, the draft status changes to "Submitted" and is locked from editing

**Q: Can I delete a draft?**
- Yes, use the "Delete" button (Admin only) or you can overwrite it by saving new changes
