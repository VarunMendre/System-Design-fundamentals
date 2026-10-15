import * as readline from "node:readline";
import { CommandParser } from "./cli/CommandParser";
import { UserService } from "./services/UserService";
import { InMemoryUserRepository } from "./repositories/InMemoryUserRepository";
import { ScryptPasswordHasher } from "./utils/PasswordHasher";

// Composition root: the only place where concrete classes are wired together.
const userRepo = new InMemoryUserRepository();
const userSvc = new UserService(userRepo, new ScryptPasswordHasher());
const parser = new CommandParser(userSvc);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});
rl.prompt();

rl.on("line", (line) => {
  if (["exit", "quit"].includes(line.trim().toLowerCase())) {
    rl.close();
    return;
  }
  const out = parser.execute(line);
  if (out) console.log(out);
  rl.prompt();
});
