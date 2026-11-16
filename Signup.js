const api = "http://localhost:3000/api"; // make sure this is defined somewhere

document.getElementById("signupform").addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.target;
    const button = event.submitter;
    const userrole = button.id === "submitAsStudent" ? "student" : "eventorganizer";
    console.log("Submit button clicked:", button.id);
    const formData = new FormData(event.target);
    const payload = {
        schoolid: formData.get("schoolid")?.trim(),
        username: formData.get("username")?.trim(),
        password: formData.get("password"),
        email: formData.get("email")?.trim(),
        section: formData.get("section"),
        year: formData.get("year"),
        department: formData.get("department"),
        course: formData.get("course"),
        role: userrole
    };
    console.log("Payload to be sent:", payload);
    button.disabled = true; // prevent double submits

    try {
        const response = await fetch(`${api}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("Signup failed:", result);
            alert(result.message || "Signup failed. Please try again.");
            return;
        }

        console.log("Backend Response:", result);
        alert("Signup successful!");
        form.reset();
        localStorage.setItem("user", JSON.stringify(result.user));
        if (userrole === "student") {
            window.location.href = "./Student/Home.html";
        } else {
            window.location.href = "./Event/Home.html";
        }
    } catch (error) {
        console.error("Error occurred while signing up:", error);
        alert("Could not reach the server. Please try again.");
    } finally {
        button.disabled = false;
    }
});