import { Command, MemorySaver } from "@langchain/langgraph";
import { graph } from "./agent";
import { State } from "./state";
import readline from "node:readline/promises";
const app = graph.compile({ checkpointer: new MemorySaver() });

const config = {
    configurable: {
        thread_id: "gmg-12345",
    },
};
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
async function main() {
    type Interrupt = {
        id: string;
        value: string;
    }[];
    type StateWithInterrupt = typeof State.State & {
        __interrupt__?: Interrupt;
    };
    let interrupts: Interrupt = [];
    while (true) {
        // First, check if there is an interrupt pending
        let input;
        if (interrupts?.length > 0) {
            // Show the approval message to the user approve/edit/reject
            const fixedOptionsForUser = ["approve", "edit", "reject"];
            let validResponse = false;
            let userChoice = "";
            while (!validResponse) {
                let promptMsg = "choose one option:\n\n";
                promptMsg += fixedOptionsForUser
                    .map((d, idx) => `${idx + 1}. ${d}`)
                    .join("\n");
                promptMsg += "\nEnter 1, 2, or 3: ";
                userChoice = await rl.question(promptMsg);
                if (["1", "2", "3"].includes(userChoice.trim())) {
                    validResponse = true;
                } else {
                    console.log("Invalid input. Please enter 1, 2, or 3.");
                }
            }
            // Map the choice to your logic:
            let resumeValue;
            if (userChoice.trim() === "1") resumeValue = "true";
            else if (userChoice.trim() === "2") {
                const newDraft = await rl.question(
                    "Please enter your updated draft: ",
                );
                resumeValue = newDraft;
            } else if (userChoice.trim() === "3") resumeValue = "false";
            input = new Command({ resume: resumeValue });
            interrupts = [];
        } else {
            // No interrupt, get user query as usual
            const query = await rl.question("You: ");
            if (query === "bye") {
                rl.close();
                break;
            }
            input = {
                messages: [
                    {
                        role: "user",
                        content: query,
                    },
                ],
            };
        }

        const result = await app.invoke(input, config);
        const _result = (result as StateWithInterrupt).__interrupt__;

        if (_result && _result.length > 0 && _result[0]) {
            console.log("AI : ", _result[0].value);
            interrupts.push(_result[0]);
        } else {
            console.log(
                result?.messages[result?.messages?.length - 1]?.content,
            );
        }
    }
}

main();

// const ourState = await app.getState(config);
// if (ourState.values.__interrupt__) {
//     input = new Command({ resume: query === "yes" ? true : false });
// }
