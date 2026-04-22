import streamlit as st
import random
from datetime import datetime
import json
import os
from PIL import Image, ImageDraw, ImageFont
import io

st.set_page_config(page_title="BossLadyLisa App", layout="wide")

st.title("🦋 BossLadyLisa's Beautify Yourself & Beyond App")
st.markdown("**A Self-Care & Emotional Realignment Hub**")


def save_to_file(data, filename):
    try:
        with open(filename, "w") as f:
            json.dump(data, f)
    except IOError as e:
        st.error(f"Error saving data to {filename}: {e}")


def load_from_file(filename, default):
    try:
        if os.path.exists(filename):
            with open(filename, "r") as f:
                return json.load(f)
        return default
    except json.JSONDecodeError as e:
        st.error(f"Error decoding JSON from {filename}: {e}. Resetting data.")
        return default
    except IOError as e:
        st.error(f"Error loading data from {filename}: {e}. Using default data.")
        return default


if "journal_entries" not in st.session_state:
    st.session_state.journal_entries = load_from_file("journal.json", [])

if "life_notes" not in st.session_state:
    st.session_state.life_notes = load_from_file(
        "life_notes.json",
        ["Note #007: *I can be the peace the world needs to feel.*"]
    )

if "affirmations" not in st.session_state:
    st.session_state.affirmations = load_from_file("affirmations.json", [
        "I am the peace the world needs to feel.",
        "My progress shines even in silence.",
        "I set boundaries with love and strength."
    ])

if "tasks" not in st.session_state:
    st.session_state.tasks = load_from_file("tasks.json", [])

if "feedback" not in st.session_state:
    st.session_state.feedback = load_from_file("feedback.json", [])

if "declutter_checklist" not in st.session_state:
    default_declutter_checklist = {
        "Clear physical space": False,
        "Organize one drawer/shelf": False,
        "Meditate for 5 minutes": False,
        "Write down worries for 10 minutes": False,
        "Practice deep breathing for 2 minutes": False,
        "Digital detox (e.g., no social media for 1 hour)": False
    }
    st.session_state.declutter_checklist = load_from_file(
        "declutter_checklist.json", default_declutter_checklist
    )


def create_quote_card(quote):
    try:
        img = Image.new("RGB", (400, 200), color="#ADD8E6")
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("arial.ttf", 20)
        except IOError:
            font = ImageFont.load_default()
            st.warning("Could not load 'arial.ttf'. Using default font.")

        words = quote.split(" ")
        lines = []
        current_line = []
        for word in words:
            test_line = " ".join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if bbox[2] - bbox[0] < 360:
                current_line.append(word)
            else:
                lines.append(" ".join(current_line))
                current_line = [word]
        lines.append(" ".join(current_line))
        wrapped_quote = "\n".join(lines)

        text_bbox = draw.textbbox((0, 0), wrapped_quote, font=font)
        text_x = (400 - (text_bbox[2] - text_bbox[0])) // 2
        text_y = (200 - (text_bbox[3] - text_bbox[1])) // 2
        draw.text((text_x, text_y), wrapped_quote, fill="black", font=font, align="center")

        img_buffer = io.BytesIO()
        img.save(img_buffer, format="PNG")
        return img_buffer.getvalue()
    except Exception as e:
        st.error(f"Oops! There was an issue generating the quote card: {e}")
        return None


st.sidebar.header("🧭 Navigation Menu")
page = st.sidebar.radio("Go to", [
    "Feel It to Release It – Reset Toolkit",
    "Grounded Thoughts – Daily Journal",
    "143 Life Notes",
    "Visual Quote Cards",
    "Boss Mode Planner",
    "Space & Mind Declutter Tools",
    "Daily 2:43 Affirmation Alerts",
    "Feedback"
])

# --- Feel It to Release It ---
if page == "Feel It to Release It – Reset Toolkit":
    st.subheader("\U0001f4c6 Today's Featured Reset Card")
    st.write("Select how you're feeling to get a personalized reset suggestion and realign your emotions.")

    mood = st.selectbox(
        "How are you feeling today?",
        ["Calm", "Chaotic", "Balanced", "Overwhelmed", "Joyful", "Anxious", "Stressed"]
    )

    reset_cards = {
        "Calm": (
            "“Because I can be the peace the world needs to feel.”",
            "Take a moment to savor this feeling. Mood: Calm • DBT-Inspired • Gratitude Focus"
        ),
        "Chaotic": (
            "“I breathe in peace, I breathe out chaos.”",
            "Focus on one small, manageable task to regain control. Mood: Chaotic • DBT-Inspired • Prioritization Practice"
        ),
        "Balanced": (
            "“My progress shines even in silence.”",
            "Acknowledge your efforts and continue with mindful intention. You're doing great! Mood: Balanced • DBT-Inspired • Self-Compassion"
        ),
        "Overwhelmed": (
            "“I set boundaries with love and strength.”",
            "Break down your challenges into smaller steps. It's okay to ask for help or take a break. Mood: Overwhelmed • DBT-Inspired • Financial Boundaries"
        ),
        "Joyful": (
            "“I am worthy of all the good things coming my way.”",
            "Share your joy or find a way to pay it forward. Let your happiness radiate! Mood: Joyful • DBT-Inspired • Spreading Positivity"
        ),
        "Anxious": (
            "“This feeling is temporary, and I am safe.”",
            "Try a grounding exercise like the 5-4-3-2-1 technique. Focus on your breath. Mood: Anxious • DBT-Inspired • Grounding Practice"
        ),
        "Stressed": (
            "“I choose calm over chaos.”",
            "Engage in a quick mindfulness exercise or a short walk to clear your head. Mood: Stressed • DBT-Inspired • Stress Reduction"
        ),
    }

    if st.button("Generate Reset Card"):
        quote, advice = reset_cards[mood]
        st.info(f"**{quote}**\n\n{advice}")
        st.balloons()

# --- Grounded Thoughts – Daily Journal ---
elif page == "Grounded Thoughts – Daily Journal":
    st.subheader("\U0001f4d3 Grounded Thoughts – Daily Journal")
    st.write("Capture your thoughts and emotions here. This is your safe space to reflect and process.")

    with st.form("journal_form"):
        entry = st.text_area(
            "Your Emotional Snapshot:",
            placeholder="Describe your mood, thoughts, or DBT reframe..."
        )
        submit = st.form_submit_button("Save Entry")

    if submit:
        if entry.strip():
            entry_time = datetime.now().strftime("%B %d, %Y, %I:%M %p")
            st.session_state.journal_entries.append(f"**{entry_time}**: {entry}")
            save_to_file(st.session_state.journal_entries, "journal.json")
            st.success("Your entry has been saved successfully!")
        else:
            st.error("Please enter some thoughts before saving your journal entry.")

    if st.session_state.journal_entries:
        st.markdown("---")
        st.markdown("### Recent Entries")
        display_entries = st.session_state.journal_entries[::-1]
        entries_per_page = 5
        total_pages = (len(display_entries) + entries_per_page - 1) // entries_per_page

        if total_pages > 1:
            current_page = st.number_input(
                "Page", min_value=1, max_value=total_pages, value=1, step=1, key="journal_page_nav"
            )
            start_index = (current_page - 1) * entries_per_page
            paginated_entries = display_entries[start_index:start_index + entries_per_page]
        else:
            paginated_entries = display_entries

        for e in paginated_entries:
            st.markdown(f"- {e}")

        if st.button("View All Entries (Newest First)", key="view_all_journal_entries"):
            for e in display_entries:
                st.markdown(f"- {e}")

# --- 143 Life Notes ---
elif page == "143 Life Notes":
    st.subheader("\U0001f9e0 143 Life Notes")
    st.write("Jot down quick insights, reminders, or wisdom you gather along your journey.")

    with st.form("note_form"):
        new_note = st.text_input(
            "Add a Life Note:",
            placeholder="e.g., I am enough. Small steps lead to big changes.",
            key="new_life_note_input"
        )
        submit_note = st.form_submit_button("Add Note")

    if submit_note:
        if new_note.strip():
            note_num = len(st.session_state.life_notes) + 1
            st.session_state.life_notes.append(f"Note #{note_num:03d}: *{new_note}*")
            save_to_file(st.session_state.life_notes, "life_notes.json")
            st.success("Your note has been added to your collection!")
            st.rerun()
        else:
            st.error("Please enter a valid note to add.")

    st.markdown("---")
    st.markdown("### All Your Life Notes")
    if st.session_state.life_notes:
        for note in reversed(st.session_state.life_notes):
            st.info(note)
    else:
        st.info("No life notes added yet. Start capturing your wisdom!")

# --- Visual Quote Cards ---
elif page == "Visual Quote Cards":
    st.subheader("\U0001f98b Visual Quote Card Preview")
    st.write("Get inspired with a beautifully crafted quote card!")

    if "current_quote_card_display" not in st.session_state:
        st.session_state.current_quote_card_display = random.choice(st.session_state.affirmations)

    img_bytes = create_quote_card(st.session_state.current_quote_card_display)
    if img_bytes:
        st.image(img_bytes, width=400, caption=st.session_state.current_quote_card_display)
    else:
        st.warning("Unable to display a quote card right now. Please try again.")

    if st.button("Generate New Quote Card", key="generate_new_quote"):
        st.session_state.current_quote_card_display = random.choice(st.session_state.affirmations)
        st.balloons()
        st.rerun()

    st.markdown("---")
    st.markdown("### Your Custom Affirmations")
    st.write("These affirmations are used to generate your quote cards.")
    if st.session_state.affirmations:
        for aff in st.session_state.affirmations:
            st.markdown(f"- *{aff}*")
    else:
        st.info("No affirmations added yet. Add some in the 'Daily 2:43 Affirmation Alerts' section!")

# --- Boss Mode Planner ---
elif page == "Boss Mode Planner":
    st.subheader("\U0001f4cb Boss Mode Planner")
    st.write("Organize your tasks and crush your goals! Mark them complete as you conquer them.")

    with st.form("task_form"):
        task = st.text_input(
            "Add a Task:",
            placeholder="e.g., Set financial boundaries, Meditate for 10 min",
            key="new_task_input"
        )
        submit_task = st.form_submit_button("Add to Planner")

    if submit_task:
        if task.strip():
            st.session_state.tasks.append({"task": task, "completed": False})
            save_to_file(st.session_state.tasks, "tasks.json")
            st.success("Task added successfully to your planner!")
            st.rerun()
        else:
            st.error("Please enter a valid task to add.")

    if st.session_state.tasks:
        st.markdown("---")
        st.markdown("### Your Current Tasks")
        incomplete_tasks = [t for t in st.session_state.tasks if not t["completed"]]
        completed_tasks = [t for t in st.session_state.tasks if t["completed"]]

        if incomplete_tasks:
            for i, task_item in enumerate(incomplete_tasks):
                task_key = f"incomplete_task_{i}_{task_item['task'].replace(' ', '_')[:20]}"
                col1, col2 = st.columns([4, 1])
                with col1:
                    st.markdown(f"{i+1}. {task_item['task']}")
                with col2:
                    if st.button("Complete", key=task_key):
                        for t in st.session_state.tasks:
                            if t["task"] == task_item["task"] and not t["completed"]:
                                t["completed"] = True
                                break
                        save_to_file(st.session_state.tasks, "tasks.json")
                        st.success(f"Task '{task_item['task']}' marked as complete! Great job!")
                        st.rerun()
        else:
            st.info("No incomplete tasks! You're on a roll! \U0001f389 All tasks completed, or none added yet.")

        st.markdown("---")
        st.markdown("### Completed Tasks")
        if completed_tasks:
            for task_item in completed_tasks:
                st.markdown(f"- ~~{task_item['task']}~~ ✅")
        else:
            st.info("No tasks completed yet. Keep going, you've got this!")

# --- Space & Mind Declutter Tools ---
elif page == "Space & Mind Declutter Tools":
    st.subheader("\U0001f9f9 Space & Mind Declutter Tools")
    st.write("Use this checklist to help declutter your physical space and mental clutter.")

    st.markdown("**Your Declutter Checklist**")
    updated_checklist_state = {}
    rerun_needed = False

    for item, checked in st.session_state.declutter_checklist.items():
        new_checked_state = st.checkbox(
            item, value=checked, key=f"declutter_item_{item.replace(' ', '_')}"
        )
        updated_checklist_state[item] = new_checked_state
        if new_checked_state != checked:
            rerun_needed = True

    if rerun_needed:
        st.session_state.declutter_checklist = updated_checklist_state
        save_to_file(st.session_state.declutter_checklist, "declutter_checklist.json")
        st.success("Checklist updated!")
        st.rerun()

# --- Daily 2:43 Affirmation Alerts ---
elif page == "Daily 2:43 Affirmation Alerts":
    st.subheader("⏰ Daily 2:43 Affirmation Alerts")
    st.write("Receive a powerful affirmation daily at 2:43 PM to uplift your spirit and keep you aligned!")

    current_time_obj = datetime.now()
    current_time_str = current_time_obj.strftime("%H:%M")
    today_date = current_time_obj.strftime("%Y-%m-%d")

    if "last_affirmation_alert_date" not in st.session_state:
        st.session_state.last_affirmation_alert_date = None

    if current_time_str == "14:43" and st.session_state.last_affirmation_alert_date != today_date:
        affirmation = random.choice(st.session_state.affirmations)
        st.markdown(f"**It's 2:43 PM! Here's your daily affirmation:**\n\n### *{affirmation}*")
        st.balloons()
        st.session_state.last_affirmation_alert_date = today_date
    elif current_time_str == "14:43":
        st.info("Your 2:43 PM affirmation has already been shown today. Stay inspired!")
    else:
        st.info(
            f"The next affirmation alert will be at 2:43 PM. "
            f"Current time: {current_time_obj.strftime('%I:%M %p')}"
        )

    if st.button("Get Today's Affirmation Now", key="get_affirmation_now"):
        affirmation = random.choice(st.session_state.affirmations)
        st.markdown(f"**Affirmation of the Moment**: *{affirmation}*")
        st.balloons()

    st.markdown("---")
    st.markdown("### Manage Your Affirmations")
    st.write("Add your own powerful statements to your collection.")

    with st.form("add_affirmation"):
        new_affirmation = st.text_input(
            "Add Your Own Affirmation:",
            placeholder="e.g., I am unstoppable, I attract abundance.",
            key="new_affirmation_input"
        )
        submit_aff = st.form_submit_button("Save Affirmation")

    if submit_aff:
        if new_affirmation.strip() and new_affirmation not in st.session_state.affirmations:
            st.session_state.affirmations.append(new_affirmation)
            save_to_file(st.session_state.affirmations, "affirmations.json")
            st.success("Affirmation added to your collection!")
            st.rerun()
        elif new_affirmation.strip():
            st.info("This affirmation is already in your list! Try a different one.")
        else:
            st.error("Please enter a valid affirmation to save.")

# --- Feedback ---
elif page == "Feedback":
    st.subheader("\U0001f48c Share Your Feedback")
    st.write("Your input helps us improve! Please let us know your thoughts, suggestions, or any issues.")

    with st.form("feedback_form"):
        feedback_text = st.text_area(
            "Your Feedback:",
            placeholder="What do you love? What could be better?",
            key="feedback_text_area"
        )
        submit_feedback = st.form_submit_button("Submit Feedback")

    if submit_feedback:
        if feedback_text.strip():
            feedback_entry = {
                "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "feedback": feedback_text
            }
            st.session_state.feedback.append(feedback_entry)
            save_to_file(st.session_state.feedback, "feedback.json")
            st.success("Thank you for your valuable feedback! We appreciate it.")
            st.rerun()
        else:
            st.error("Please enter your feedback before submitting.")

    st.markdown("---")
    st.markdown("### Past Feedback")
    if st.session_state.feedback:
        for fb in reversed(st.session_state.feedback):
            st.info(f"On {fb['time']}: \"{fb['feedback']}\"")
    else:
        st.info("No feedback submitted yet. Be the first to share your thoughts!")
