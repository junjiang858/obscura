import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { en } from "../../i18n/messages/en";
import { TaskLaunchAnimation } from "./TaskLaunchAnimation";

describe("TaskLaunchAnimation", () => {
  it("announces that a new background task was added to the queue", () => {
    render(
      <TaskLaunchAnimation
        launch={{
          icon: "download",
          id: "launch-1",
          label: "Generate preview",
        }}
        t={en}
      />,
    );

    expect(screen.getByText("Generate preview Added to background queue.")).toBeInTheDocument();
    expect(screen.getByTestId("task-launch-token")).toHaveTextContent("Generate preview");
  });
});
