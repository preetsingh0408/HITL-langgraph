import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const State = Annotation.Root({
    ...MessagesAnnotation.spec,
    firstDraft: Annotation<string>,
    updatedDraft: Annotation<string>,
    approved: Annotation<boolean>,
});
