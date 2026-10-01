import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { FilterGroup } from "./filter-group";

const props = {
  label: "Nation",
  icon: null,
  options: [
    { value: "japan", label: "Japan" },
    { value: "usa", label: "USA" },
  ],
};

function expectPressed(...labels: string[]) {
  const group = within(screen.getByRole("group", { name: "Nation" }));
  expect(
    group
      .getAllByRole("button", { pressed: true })
      .map((button) => button.textContent),
  ).toEqual(labels);
  expect(group.getAllByRole("button", { pressed: false })).toHaveLength(
    props.options.length + 1 - labels.length,
  );
}

it('selects an option from "All"', () => {
  const onChange = vi.fn();
  const { rerender } = render(
    <FilterGroup {...props} selected={undefined} onChange={onChange} />,
  );

  expectPressed("All");
  fireEvent.click(screen.getByRole("button", { name: "Japan" }));
  expect(onChange).toHaveBeenCalledExactlyOnceWith(["japan"]);

  rerender(<FilterGroup {...props} selected={["japan"]} onChange={onChange} />);
  expectPressed("Japan");

  rerender(<FilterGroup {...props} selected={[]} onChange={onChange} />);
  expectPressed("All");
});

it("adds and removes options while preserving other selections and the input arrays", () => {
  const onChange = vi.fn();
  const selected = ["japan"];
  const { rerender } = render(
    <FilterGroup {...props} selected={selected} onChange={onChange} />,
  );

  expectPressed("Japan");
  fireEvent.click(screen.getByRole("button", { name: "USA" }));
  expect(onChange).toHaveBeenNthCalledWith(1, ["japan", "usa"]);
  expect(selected).toEqual(["japan"]);

  const bothSelected = ["japan", "usa"];
  rerender(
    <FilterGroup {...props} selected={bothSelected} onChange={onChange} />,
  );
  expectPressed("Japan", "USA");

  fireEvent.click(screen.getByRole("button", { name: "Japan" }));
  expect(onChange).toHaveBeenNthCalledWith(2, ["usa"]);
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(bothSelected).toEqual(["japan", "usa"]);

  rerender(<FilterGroup {...props} selected={["usa"]} onChange={onChange} />);
  expectPressed("USA");
});

it('restores "All" when the last selection is removed or "All" is clicked', () => {
  const onChange = vi.fn();
  const { rerender } = render(
    <FilterGroup {...props} selected={["japan"]} onChange={onChange} />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Japan" }));
  expect(onChange).toHaveBeenNthCalledWith(1, undefined);

  rerender(<FilterGroup {...props} selected={undefined} onChange={onChange} />);
  expectPressed("All");

  rerender(
    <FilterGroup {...props} selected={["japan", "usa"]} onChange={onChange} />,
  );
  expectPressed("Japan", "USA");
  fireEvent.click(screen.getByRole("button", { name: "All" }));
  expect(onChange).toHaveBeenNthCalledWith(2, undefined);
  expect(onChange).toHaveBeenCalledTimes(2);

  rerender(<FilterGroup {...props} selected={undefined} onChange={onChange} />);
  expectPressed("All");
});
