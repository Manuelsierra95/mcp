import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  afterBrainCall,
  decideStop,
  decideWrite,
  isBrainPath,
} from "./guard.ts"
import { emptyState } from "./state.ts"

describe("the hooks", () => {
  it("knows which paths belong to the BRAIN", () => {
    assert.ok(isBrainPath("docs/index.md"))
    assert.ok(isBrainPath("docs/conventions/estilo.md"))
    assert.ok(!isBrainPath("apps/web/app/page.tsx"))
  })

  it("blocks a write to the BRAIN", () => {
    const decision = decideWrite("docs/conventions/estilo.md", {
      ...emptyState(),
      contextLoaded: true,
    })

    assert.equal(decision.allow, false)
    assert.match(decision.reason ?? "", /brain_record/)
  })

  it("blocks an edit when the BRAIN was not consulted", () => {
    const decision = decideWrite("apps/web/app/page.tsx", emptyState())

    assert.equal(decision.allow, false)
    assert.match(decision.reason ?? "", /brain_context/)
  })

  it("allows an edit when the BRAIN was consulted", () => {
    const decision = decideWrite("apps/web/app/page.tsx", {
      ...emptyState(),
      contextLoaded: true,
    })

    assert.equal(decision.allow, true)
  })

  it("remembers that the BRAIN was consulted", () => {
    const state = afterBrainCall(emptyState(), "mcp__brain__brain_context")

    assert.equal(state.contextLoaded, true)
  })

  it("remembers that the BRAIN was written", () => {
    const state = afterBrainCall(emptyState(), "brain_note")

    assert.equal(state.wroteBrain, true)
  })

  it("does not let a session finish without documenting a change", () => {
    const decision = decideStop({
      ...emptyState(),
      contextLoaded: true,
      touchedCode: true,
    })

    assert.equal(decision.allow, false)
    assert.match(decision.reason ?? "", /brain_note/)
  })

  it("lets a session that changed nothing finish", () => {
    const decision = decideStop(emptyState())

    assert.equal(decision.allow, true)
  })
})
