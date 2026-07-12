import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { createUser, getUser, updateUser } from "../../api/users.api";

export default function UserForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = Boolean(id);

  const existing = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { role: "cashier", is_active: true },
  });

  useEffect(() => {
    if (existing.data?.data) {
      const u = existing.data.data;
      reset({
        full_name: u.full_name || "",
        username: u.username || "",
        email: u.email || "",
        role: u.role || "cashier",
        password: "",
        pin: "",
        is_active: u.is_active !== false,
      });
    }
  }, [existing.data, reset]);

  const m = useMutation({
    mutationFn: (v) => {
      const payload = { ...v };
      if (!payload.password) delete payload.password;
      if (!payload.pin) delete payload.pin;
      return isEdit ? updateUser(id, payload) : createUser(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "User updated." : "User created.");
      nav("/users");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Save failed"),
  });

  return (
    <div className="page-wrap form-page">
      <div className="form-page__top">
        <button type="button" className="icon-back" onClick={() => nav("/users")}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1>{isEdit ? "Edit User" : "New User"}</h1>
          <p className="page-sub">Developer account management</p>
        </div>
        <div className="form-page__actions">
          <button type="button" className="btn-ghost" onClick={() => nav("/users")}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={m.isPending}
            onClick={handleSubmit((v) => m.mutate(v))}
          >
            {m.isPending ? "Saving..." : "Save user"}
          </button>
        </div>
      </div>

      <form className="panel-card form-grid" onSubmit={handleSubmit((v) => m.mutate(v))}>
        <label>
          <span>Full name</span>
          <input className="field-input" {...register("full_name", { required: true })} />
        </label>
        <label>
          <span>Username</span>
          <input className="field-input" {...register("username")} />
        </label>
        <label>
          <span>Email (optional)</span>
          <input className="field-input" type="email" {...register("email")} />
        </label>
        <label>
          <span>Role</span>
          <select className="field-input" {...register("role")}>
            <option value="owner">owner</option>
            <option value="cashier">cashier</option>
            <option value="developer">developer</option>
          </select>
        </label>
        <label>
          <span>{isEdit ? "New password (optional)" : "Password"}</span>
          <input
            className="field-input"
            type="password"
            autoComplete="new-password"
            {...register("password", { required: !isEdit })}
          />
        </label>
        <label>
          <span>PIN (optional)</span>
          <input
            className="field-input"
            inputMode="numeric"
            maxLength={6}
            {...register("pin")}
          />
        </label>
      </form>
    </div>
  );
}
