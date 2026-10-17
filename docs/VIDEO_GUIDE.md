# Video Recording Guide

Quick reference for recording your CMRS demonstration video.

## Equipment Needed

- **Screen Recorder:** OBS Studio (free), Loom, or Camtasia
- **Microphone:** Built-in or external microphone
- **Browser:** Chrome/Edge/Firefox in Incognito mode
- **Internet:** Stable connection for ngrok access

## Pre-Recording Checklist (5 min)

### Environment Setup
- [ ] Close unnecessary applications
- [ ] Disable notifications (phone, email, Slack)
- [ ] Ensure quiet recording environment
- [ ] Test microphone audio quality

### Browser Setup
- [ ] Open Incognito/Private window
- [ ] Navigate to: https://unopened-lend-wriggly.ngrok-free.dev/
- [ ] Click 'Visit Site' on ngrok warning
- [ ] Keep only this tab open

### Recording Setup
- [ ] Open screen recorder
- [ ] Select browser window as recording area
- [ ] Test recording (10 seconds)
- [ ] Verify video and audio quality

## Video Structure (5 minutes)

### Section Breakdown

1. **Opening (30 seconds)**
   - Introduce application
   - Show login page
   - Mention key features

2. **Dashboard Walkthrough (45 seconds)**
   - Login as admin
   - Show metrics and charts
   - Explain business context

3. **Collection Workflow (90 seconds)**
   - Record new collection
   - Show validation
   - Explain business rules

4. **Submission Process (60 seconds)**
   - Submit collection
   - Show duplicate prevention
   - Demonstrate approval needs

5. **Manager Reconciliation (90 seconds)**
   - Switch to manager role
   - Approve/reject submission
   - Show branch isolation

6. **Bank Integration (45 seconds)**
   - Create deposit
   - Settle transaction
   - Show financial integrity

7. **Technical Summary (30 seconds)**
   - Stack overview
   - Security features
   - Testing coverage

8. **Closing (15 seconds)**
   - Recap features
   - Show public URL
   - Thank viewers

## Recording Best Practices

### Speaking Tips
- Speak clearly and at moderate pace
- Use simple language
- Explain business value, not just UI
- Pause briefly between sections

### Visual Tips
- Move mouse slowly and deliberately
- Use cursor to guide viewer attention
- Zoom into important areas
- Show full workflows, not just highlights

### Technical Tips
- Record in 1080p or 720p minimum
- Use MP4 format for compatibility
- Keep file size under 200MB
- Test final video on different devices

## What to Avoid

### Security Concerns
- ❌ Don't show passwords being typed
- ❌ Don't show sensitive environment variables
- ❌ Don't reveal API tokens or secrets
- ❌ Don't show real customer data (use demo)

### Quality Issues
- ❌ Don't rush through screens
- ❌ Don't explain every button
- ❌ Don't leave long silences
- ❌ Don't skip error handling demos

## Post-Production

### Basic Editing
- Remove long pauses
- Add section titles/overlays (optional)
- Ensure audio is clear
- Export in MP4 format

### Upload Options
- **YouTube:** Free, accessible, easy to share
- **Vimeo:** Professional look, privacy options
- **Google Drive:** Simple sharing, private by default
- **Loom:** Built-in hosting, easy embedding

### Video Metadata
- **Title:** "ARTH CMRS - Cash Management System Demo"
- **Description:** Include public URL and features
- **Tags:** Django, React, microfinance, full-stack
- **Thumbnail:** Dashboard screenshot with logo

## Sample Script Excerpts

### Opening
> "Welcome to this demonstration of ARTH CMRS, a Cash Management and Reconciliation System designed for microfinance operations..."

### Collection Workflow
> "Field agents use this interface to record cash collected from borrowers. The system validates that the amount doesn't exceed the outstanding loan balance..."

### Manager Approval
> "Branch managers see only their branch's pending submissions. When they approve a cash submission, it becomes available for bank deposit..."

### Closing
> "This system demonstrates complete cash tracking with role-based security, financial integrity controls, and comprehensive testing. Thank you for watching."

## Quality Checklist

Before submitting, verify:

- [ ] Video plays without buffering
- [ ] Audio is clear and understandable
- [ ] All workflows demonstrated
- [ ] Public URL visible in video
- [ ] Duration is 4-5 minutes
- [ ] No sensitive information shown
- [ ] Video uploaded and link works

---

## Quick Timeline

| Time | Section | Duration |
|------|---------|----------|
| 0:00 | Opening | 30s |
| 0:30 | Dashboard | 45s |
| 1:15 | Collections | 90s |
| 2:45 | Submissions | 60s |
| 3:45 | Manager View | 90s |
| 5:15 | Bank Integration | 45s |
| 6:00 | Technical | 30s |
| 6:30 | Closing | 15s |
| **Total** | | **~5 min** |

---

**Note:** Practice the demo 2-3 times before recording. Familiarity with the flow will make the recording smoother and more professional.
