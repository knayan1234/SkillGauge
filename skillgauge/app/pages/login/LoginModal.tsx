import { useForm } from "react-hook-form";

function LoginModal({ mode, onClose }) {
  const { register, handleSubmit } = useForm();

  const submitHandler = (data) => {
    console.log(mode, data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 relative">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-black"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-semibold text-center mb-6">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          {/* Username */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              {...register("username", { required: true })}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter your username"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              {...register("password", { required: true })}
              type="password"
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="••••••••"
            />
          </div>

          {/* Confirm password (register only) */}
          {mode === "register" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                {...register("confirmPassword", { required: true })}
                type="password"
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:opacity-90 transition"
          >
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
