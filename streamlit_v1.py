import streamlit as st

st.set_page_config(page_title="Notiq", layout="wide")

# some sample notes to show
if "notes" not in st.session_state:
    st.session_state.notes = {
        "n1": {"title": "Weekly Errands", "category": "Daily Tasks", "text": "- [x] Buy groceries\n- [ ] Call mom\n- [x] Pay electricity bill\n- [ ] Pick up dry cleaning"},
        "n2": {"title": "Machine Learning", "category": "Work / Study", "text": "Supervised learning:\n- Linear regression\n- Decision trees\n- Random forests\n\nDeep learning:\n- Neural networks\n- Backpropagation\n- CNNs"},
        "n3": {"title": "Weekly Workout Plan", "category": "Health & Fitness", "text": "Monday: Upper body\nTuesday: Lower body\nWednesday: Rest\nThursday: Push\nFriday: Pull\nSaturday: Legs + core\nSunday: Rest"},
        "n4": {"title": "February Budget", "category": "Planning & Finance", "text": "Income: 2500\nRent: 800\nGroceries: 300\nTransport: 80\nSavings: 500"},
        "n5": {"title": "Restaurant Analytics SaaS", "category": "Ideas & Creativity", "text": "Problem: Small restaurants dont have analytics\nSolution: Simple dashboard for POS data\nPrice: 49/month"},
    }

if "selected" not in st.session_state:
    st.session_state.selected = "n2"

# sidebar
with st.sidebar:
    st.title("Notiq")
    st.caption("a simple note taking app")
    st.divider()

    # new note
    new_title = st.text_input("New note title")
    if st.button("Create note"):
        if new_title:
            key = f"n{len(st.session_state.notes) + 1}"
            st.session_state.notes[key] = {"title": new_title, "category": "Daily Tasks", "text": ""}
            st.session_state.selected = key
            st.rerun()

    st.divider()

    # list of notes
    for key, note in st.session_state.notes.items():
        if st.button(note["title"], key=f"btn_{key}", use_container_width=True):
            st.session_state.selected = key


# main area
note = st.session_state.notes.get(st.session_state.selected)

if note:
    col1, col2 = st.columns([3, 1])

    with col1:
        st.header(note["title"])
        st.caption(note["category"])

        # editor
        updated = st.text_area("Edit note", value=note["text"], height=400, label_visibility="collapsed")
        if updated != note["text"]:
            note["text"] = updated

        # category picker
        categories = ["Daily Tasks", "Work / Study", "Health & Fitness", "Planning & Finance", "Ideas & Creativity"]
        new_cat = st.selectbox("Category", categories, index=categories.index(note["category"]))
        note["category"] = new_cat

        # delete button
        if st.button("Delete note"):
            if len(st.session_state.notes) > 1:
                del st.session_state.notes[st.session_state.selected]
                st.session_state.selected = list(st.session_state.notes.keys())[0]
                st.rerun()

    with col2:
        st.subheader("Info")

        # word count
        words = len(note["text"].split())
        st.metric("Words", words)

        # line count
        lines = len(note["text"].strip().split("\n")) if note["text"].strip() else 0
        st.metric("Lines", lines)

        # show category
        st.info(f"Category: {note['category']}")

else:
    st.write("Select a note from the sidebar")
