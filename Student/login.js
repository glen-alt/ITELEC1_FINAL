
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const button = event.submitter;
    const form = event.target;
    const formData = new FormData(form);
    const payload = {
        schoolid: formData.get("schoolid")?.trim(),
        password: formData.get("password"),
        role: "student"
    };
    button.disabled = true;

    try { 
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("Login failed:", result);
            alert(result.message || "Login failed. Please try again.");
            return;
        }

        console.log("Backend Response:", result);
        alert("Login successful!");
        form.reset();
        localStorage.setItem("user", JSON.stringify(result.user));
        window.location.href = "./Home.html";
    } catch (error) {
        console.error("Error occurred while logging in:", error);
        alert("Could not reach the server. Please try again.");
    } finally {
        button.disabled = false;
    }

});