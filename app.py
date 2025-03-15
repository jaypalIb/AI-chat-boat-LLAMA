import pymysql
from flask import Flask, request, jsonify, render_template
import asyncio
import subprocess

app = Flask(__name__, static_folder="static", template_folder="templates")

# Global variables
context = ""  # Initialize as an empty string
conversation_history = []  # To store the conversation history

# Fetch data from the database
def fetch_data(query):
    connection = pymysql.connect(
        host="localhost",
        port=8889,
        user="root",
        password="root",
        database="test_asbestos"
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            result = cursor.fetchall()
        return result
    finally:
        connection.close()

# Load context once at startup
def load_context():
    global context  # Access the global context variable
    query = "SELECT id, caseNumber, status, businessName, companyAddressTown as City FROM cases ORDER BY id ASC limit 30"
    data = fetch_data(query)
    # print(len(data))
    context = "\n".join([f"ID: {row[0]}, Case Number: {row[1]}, Status: {row[2]}, Business Name: {row[3]}, City: {row[4]}" for row in data])

    # print((context))

# Async function to query Ollama
async def query_ollama(prompt):
    try:
        process = await asyncio.create_subprocess_exec(
            "ollama", "run", "llama3.2", prompt,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode == 0:
            return stdout.decode().strip().replace("\n", "<br>")
        else:
            return f"Error: {stderr.decode()}"
    except Exception as e:
        return f"Error querying Ollama: {e}"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
async def chat():
    global conversation_history, context

    print((context))

    user_message = request.json.get("message", "")
    if not user_message:
        return jsonify({"response": "Please provide a message."})

    # Append the user's message to the conversation history
    conversation_history.append({"role": "user", "content": user_message})

    # Construct the prompt using the dataset context and conversation history
    prompt = "You are an intelligent assistant with access to the following dataset:\n\n"
    prompt += f"{context}\n\n"
    prompt += "This dataset contains information about cases, including ID, Case Number, Status, and Business Name.\n"
    prompt += (
        "If the user's question pertains to this dataset, use the relevant information to answer accurately. "
        "For general questions unrelated to the dataset, provide a thoughtful and appropriate response.\n\n"
    )

    for message in conversation_history[-10:]:  # Include the last 10 exchanges for context
        prompt += f"{message['role'].capitalize()}: {message['content']}\n"

    prompt += "Assistant:"

    # Query the model
    response = await query_ollama(prompt)

    # Append the assistant's response to the conversation history
    conversation_history.append({"role": "assistant", "content": response})

    print("Prompt:", prompt)
    print("Response:", response)

    return jsonify({"response": response})

# Reload the context manually if needed
@app.route("/reload_context", methods=["POST"])
def reload_context():
    load_context()  # Reload context from the database
    return jsonify({"response": "Context reloaded successfully."})

# Clear the conversation history if needed
@app.route("/clear_history", methods=["POST"])
def clear_history():
    global conversation_history
    conversation_history = []
    return jsonify({"response": "Conversation history cleared successfully."})

if __name__ == "__main__":
    # Load the context once at startup
    # load_context()
    app.run(host="0.0.0.0", port=5003, debug=True)
