import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TagInput } from "@/components/common/TagInput"

// Regression coverage for the reported bug: typing a value into a tag input
// inside the product form's single shared <form> and pressing Enter used to
// submit the whole dialog (save/create) instead of adding a chip, because a
// bare <input> inside a <form> implicitly submits on Enter.
function Harness({ initial = [] as string[] }) {
  const submit = vi.fn()
  const onChange = vi.fn()
  render(
    <form onSubmit={(e) => { e.preventDefault(); submit() }}>
      <TagInput value={initial} onChange={onChange} placeholder="Type and press Enter…" />
    </form>
  )
  return { submit, onChange }
}

describe("TagInput", () => {
  it("adds a chip on Enter and never submits the surrounding form", () => {
    const { submit, onChange } = Harness({ initial: [] })
    const input = screen.getByPlaceholderText("Type and press Enter…")
    fireEvent.change(input, { target: { value: "Tikka" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith(["Tikka"])
    expect(submit).not.toHaveBeenCalled()
  })

  it("supports adding multiple values one after another (type, Enter, type, Enter…)", () => {
    const onChange = vi.fn()
    const { rerender } = render(<TagInput value={[]} onChange={onChange} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "Tikka" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).toHaveBeenLastCalledWith(["Tikka"])

    rerender(<TagInput value={["Tikka"]} onChange={onChange} />)
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Fillet" } })
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" })
    expect(onChange).toHaveBeenLastCalledWith(["Tikka", "Fillet"])
  })

  it("adds a chip on comma too", () => {
    const onChange = vi.fn()
    render(<TagInput value={[]} onChange={onChange} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "Small Cubes" } })
    fireEvent.keyDown(input, { key: "," })
    expect(onChange).toHaveBeenCalledWith(["Small Cubes"])
  })

  it("ignores an empty or whitespace-only draft", () => {
    const onChange = vi.fn()
    render(<TagInput value={[]} onChange={onChange} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "   " } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("de-duplicates case-insensitively", () => {
    const onChange = vi.fn()
    render(<TagInput value={["Tikka"]} onChange={onChange} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "tikka" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("is not capped at 3 (or any fixed count) unless maxTags is explicitly passed", () => {
    const onChange = vi.fn()
    const many = ["A", "B", "C", "D", "E"]
    render(<TagInput value={many} onChange={onChange} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "F" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith([...many, "F"])
  })

  it("removes a chip via its remove button", () => {
    const onChange = vi.fn()
    render(<TagInput value={["Tikka", "Fillet"]} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Remove Tikka"))
    expect(onChange).toHaveBeenCalledWith(["Fillet"])
  })

  it("removes the last chip on Backspace when the draft is empty", () => {
    const onChange = vi.fn()
    render(<TagInput value={["Tikka", "Fillet"]} onChange={onChange} />)
    const input = screen.getByRole("textbox")
    fireEvent.keyDown(input, { key: "Backspace" })
    expect(onChange).toHaveBeenCalledWith(["Tikka"])
  })

  it("commits the draft on blur too, not just Enter", () => {
    const onChange = vi.fn()
    render(<TagInput value={[]} onChange={onChange} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "Boneless" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(["Boneless"])
  })
})
