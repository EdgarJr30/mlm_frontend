import Swal from "sweetalert2";

export function showSuccessAlert(title: string, text: string) {
  return Swal.fire({
    title,
    text,
    icon: "success",
    showCancelButton: true,
    confirmButtonText: "Crear otro ticket",
    cancelButtonText: "Cerrar",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#6b7280",
    allowOutsideClick: true,
    allowEscapeKey: true,
  })
}

// Puedes agregar más funciones aquí
export function showErrorAlert(title: string, text: string) {
  return Swal.fire({
    title,
    text,
    icon: "error",
    confirmButtonText: "Cerrar",
    confirmButtonColor: "#e53e3e",
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
}