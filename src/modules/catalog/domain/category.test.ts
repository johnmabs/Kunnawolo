import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Category } from "./category";
describe("Category", () => { it("preserves NFC Unicode and organization identity", () => { const category = Category.create(Identifier.fromString("cat"), Identifier.fromString("org"), "  Fɔ́lɔ  "); expect(category).toMatchObject({ name: "Fɔ́lɔ".normalize("NFC"), isActive: true }); expect(category.deactivate().organizationId.value).toBe("org"); }); });
