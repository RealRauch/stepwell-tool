#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createDocsServer } from "./server.ts";

const server = createDocsServer();
await server.connect(new StdioServerTransport());
