// list-models.js

const API_KEY = "AIzaSyAEabLj9BYXZHzZrTXjJDVCexy_OO7ZmXs";

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.models) {
      console.log("No se encontraron modelos.");
      return;
    }

    console.log("📦 Modelos disponibles:\n");

    data.models.forEach((model) => {
      console.log(`🔹 Nombre: ${model.name}`);
      console.log(
        `   Métodos soportados: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`
      );
      console.log("--------------------------------------------------");
    });

  } catch (error) {
    console.error("❌ Error al obtener modelos:", error.message);
  }
}

listModels();