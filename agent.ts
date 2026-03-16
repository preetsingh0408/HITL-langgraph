import { interrupt, StateGraph } from "@langchain/langgraph";
import { State } from "./state";

type TypeState = typeof State.State;

async function draft(state: TypeState) {
    //llm call
    return {
        firstDraft: "This is first draft content.",
    };
}

async function approvalNode(state: TypeState) {
    let approved = interrupt("Do you approve it?");
    if (typeof approved === "string") {
        const trimmed = approved.trim().toLowerCase();
        approved = trimmed === "true";
    }
    return { approved: approved };
}

async function reviewOrApproveNode(state: TypeState) {
    let userFeedback = interrupt(
        "Please check if this draft is good and select 'yes' or 'no' or 'edit'",
    );
    if (userFeedback == "true" || userFeedback == "false") {
        if (typeof userFeedback === "string") {
            const trimmed = userFeedback.trim().toLowerCase();
            userFeedback = trimmed === "true";
        }
        return { approved: userFeedback };
    } else {
        return { updatedDraft: userFeedback };
    }
}

async function sendEmailOrNot(state: TypeState) {
    // todo: Send email through email APIs
    console.log("Continuing doing some heavy work before sending email...");

    const approved = state.approved;
    const updatedDraft = state.updatedDraft;
    if (updatedDraft) {
        return {
            messages: [
                ...state.messages,
                {
                    role: "assistant",
                    content: `Sending email approved: ${state.updatedDraft}`,
                },
            ],
        };
    } else if (approved) {
        return {
            messages: [
                ...state.messages,
                {
                    role: "assistant",
                    content: `Sending email approved: ${state.firstDraft}`,
                },
            ],
        };
    } else {
        return {
            messages: [
                ...state.messages,
                { role: "assistant", content: "Email sending cancelled." },
            ],
        };
    }
}

// export const graph = new StateGraph(State)
//     .addNode("draft", draft)
//     .addNode("sendEmailOrNot", sendEmailOrNot)
//     .addNode("approvalNode", approvalNode)
//     .addEdge("__start__", "draft")
//     .addEdge("draft", "approvalNode")
//     .addEdge("approvalNode", "sendEmailOrNot")
//     .addEdge("sendEmailOrNot", "__end__");

export const graph = new StateGraph(State)
    .addNode("draft", draft)
    .addNode("sendEmailOrNot", sendEmailOrNot)
    .addNode("reviewOrApproveNode", reviewOrApproveNode)
    .addEdge("__start__", "draft")
    .addEdge("draft", "reviewOrApproveNode")
    .addEdge("reviewOrApproveNode", "sendEmailOrNot")
    .addEdge("sendEmailOrNot", "__end__");
