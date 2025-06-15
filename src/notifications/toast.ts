import { toast } from "react-toastify";

// Toast de éxito
export function showToastSuccess(message: string) {
  toast.success(message);
}

// Toast de error
export function showToastError(message: string) {
  toast.error(message);
}

// Toast de información
export function showToastInfo(message: string) {
  toast.info(message);
}