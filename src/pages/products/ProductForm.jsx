import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Package, DollarSign, Box } from "lucide-react";
import { createProduct, getProduct, updateProduct } from "../../api/products.api";
import { createCategory, listCategories } from "../../api/categories.api";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category_name: z.string().optional(),
  barcode: z.string().optional(),
  buying_price: z.coerce.number().gt(0, "Must be greater than 0"),
  selling_price: z.coerce.number().gt(0, "Must be greater than 0"),
  initial_stock: z.coerce.number().min(0).optional(),
  initial_stock_pieces: z.coerce.number().min(0).optional(),
  low_stock_threshold: z.coerce.number().min(0).optional(),
  is_package: z.boolean().optional(),
  package_size: z.coerce.number().optional(),
  package_buying_price: z.coerce.number().optional(),
  package_selling_price: z.coerce.number().optional(),
});

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = !!id;

  const categories = useQuery({ queryKey: ["cats"], queryFn: () => listCategories({}) });
  const existing = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { is_package: true, package_size: 12 },
  });

  const isPackage = useWatch({ control, name: "is_package" });

  useEffect(() => {
    if (existing.data?.data) {
      const p = existing.data.data;
      Object.entries(p).forEach(([k, v]) => {
        if (k === "low_stock_threshold" && p.package_size > 0) {
          setValue(k, v / p.package_size);
        } else if (k !== "inventory" && k !== "categories") {
          setValue(k, v);
        }
      });
      const catName = (categories.data?.data || []).find(
        (c) => Number(c.id) === Number(p.category_id)
      )?.name;
      if (catName) setValue("category_name", catName);
    }
  }, [existing.data, categories.data, setValue]);

  const m = useMutation({
    mutationFn: async (v) => {
      const allCats = categories.data?.data || [];
      const typedName = String(v.category_name || "").trim();
      let categoryId = null;

      if (typedName) {
        const found = allCats.find(
          (c) => String(c.name || "").trim().toLowerCase() === typedName.toLowerCase()
        );
        if (found) {
          categoryId = Number(found.id);
        } else {
          try {
            const created = await createCategory({ name: typedName });
            categoryId = Number(created?.data?.id);
          } catch (err) {
            const refreshed = await listCategories({});
            const foundAfter = (refreshed?.data || []).find(
              (c) => String(c.name || "").trim().toLowerCase() === typedName.toLowerCase()
            );
            if (foundAfter) categoryId = Number(foundAfter.id);
            else throw err;
          }
        }
      }

      if (!categoryId) throw new Error("Category is required.");

      const pkgSize = Number(v.package_size || 1);
      const payload = {
        ...v,
        category_id: categoryId,
        unit_of_measure: "piece",
        is_weighed: false,
        low_stock_threshold: Number(v.low_stock_threshold || 0) * pkgSize,
      };

      if (!isEdit) {
        payload.initial_stock =
          Number(v.initial_stock || 0) * pkgSize + Number(v.initial_stock_pieces || 0);
      } else {
        delete payload.initial_stock;
      }
      delete payload.initial_stock_pieces;
      delete payload.category_name;

      return isEdit ? updateProduct(id, payload) : createProduct(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Product updated." : "Product created.");
      nav("/products");
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || e.message || "Failed to save product."),
  });

  const catOptions = categories.data?.data || [];

  return (
    <div className="page-wrap form-page">
      <div className="form-page__top">
        <button type="button" className="icon-back" onClick={() => nav("/products")}>
          <ArrowLeft size={16} />
        </button>
        <h1>{isEdit ? "Update Product" : "New Product"}</h1>
        <div className="form-page__actions">
          <button type="button" className="btn-ghost" onClick={() => nav("/products")}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={m.isPending}
            onClick={handleSubmit((v) => m.mutate(v))}
          >
            {m.isPending ? "Saving..." : isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>

      <form className="product-form" onSubmit={handleSubmit((v) => m.mutate(v))}>
        <section className="panel-card">
          <div className="section-head">
            <Package size={18} />
            <h2>Product Info</h2>
          </div>
          <div className="form-grid">
            <label>
              <span>Name *</span>
              <input className="field-input" {...register("name")} />
              {errors.name && <em>{errors.name.message}</em>}
            </label>
            <label>
              <span>Category *</span>
              <input
                className="field-input"
                list="category-options"
                placeholder="Type or select category"
                {...register("category_name")}
              />
              <datalist id="category-options">
                {catOptions.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </label>
            {!isEdit && (
              <>
                <label>
                  <span>Initial stock (pkgs)</span>
                  <input className="field-input" type="number" min="0" {...register("initial_stock")} />
                </label>
                <label>
                  <span>Extra pieces</span>
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    {...register("initial_stock_pieces")}
                  />
                </label>
              </>
            )}
          </div>
        </section>

        <section className="panel-card">
          <div className="section-head">
            <DollarSign size={18} />
            <h2>Pricing</h2>
          </div>
          <div className="form-grid">
            <label>
              <span>Buying price *</span>
              <input className="field-input" type="number" step="0.01" {...register("buying_price")} />
              {errors.buying_price && <em>{errors.buying_price.message}</em>}
            </label>
            <label>
              <span>Selling price *</span>
              <input className="field-input" type="number" step="0.01" {...register("selling_price")} />
              {errors.selling_price && <em>{errors.selling_price.message}</em>}
            </label>
            <label>
              <span>Low stock warning (pkgs)</span>
              <input
                className="field-input"
                type="number"
                step="0.01"
                {...register("low_stock_threshold")}
              />
            </label>
          </div>
        </section>

        <section className="panel-card">
          <div className="section-head">
            <Box size={18} />
            <h2>Packaging</h2>
          </div>
          <label className="pos-check">
            <input type="checkbox" {...register("is_package")} />
            Sold in packages
          </label>
          {isPackage && (
            <div className="form-grid" style={{ marginTop: 14 }}>
              <label>
                <span>Pieces per package</span>
                <input className="field-input" type="number" min="2" {...register("package_size")} />
              </label>
              <label>
                <span>Package buying price</span>
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  {...register("package_buying_price")}
                />
              </label>
              <label>
                <span>Package selling price</span>
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  {...register("package_selling_price")}
                />
              </label>
            </div>
          )}
        </section>
      </form>
    </div>
  );
}
