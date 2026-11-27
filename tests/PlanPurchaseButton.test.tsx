import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanPurchaseButton } from "../src/components/subscription/SubscriptionPanel";
const state=vi.hoisted(()=>({ purchase: vi.fn(), reset: vi.fn() }));
vi.mock("../src/hooks/useAuth",()=>({ useAuth:()=>({ user:{ id:"actor" } }) }));
vi.mock("../src/hooks/useSubscriptions",()=>({ usePurchasePlan:()=>({ mutateAsync:state.purchase,reset:state.reset,isPending:false,error:null }), usePlans:vi.fn(),useSubscriptions:vi.fn(),useSubscriptionTransactions:vi.fn() }));
const plan={ id:"plus-monthly",name:"Academix Plus Mensual",audience:"person" as const,priceMxn:19.99,months:1,features:["Cursos incluidos"],purchasable:true };
beforeEach(()=>{
 sessionStorage.clear();
 HTMLDialogElement.prototype.showModal=function(){ this.setAttribute("open",""); };
 HTMLDialogElement.prototype.close=function(){ this.removeAttribute("open"); };
});
afterEach(() => vi.restoreAllMocks());
describe("simulated plan purchase",()=>{
 it("shows server price and benefits, then confirms only after backend receipt",async()=>{
  state.purchase.mockResolvedValue({ id:"receipt",subscription:{ endsAt:"2026-12-01T00:00:00Z" } });
  render(<MemoryRouter><PlanPurchaseButton plan={plan}/></MemoryRouter>); const user=userEvent.setup();
  await user.click(screen.getByRole("button",{ name:"Comprar plan (simulado)" }));
  expect(state.purchase).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toHaveTextContent("19.99");
  expect(screen.getByRole("dialog")).toHaveTextContent("Cursos incluidos");
  await user.click(screen.getByRole("button",{ name:"Confirmar compra simulada" }));
  await waitFor(()=>expect(screen.getByRole("status")).toHaveTextContent("Compra simulada registrada"));
  expect(state.purchase).toHaveBeenCalledWith({ plan,organizationId:undefined,idempotencyKey:expect.any(String) });
  expect(sessionStorage.getItem("academix:plan-purchase:actor:plus-monthly:personal")).toBeNull();
 });
 it("retains the idempotency key across an ambiguous failure and reopening",async()=>{
  state.purchase.mockRejectedValue(new Error("timeout"));
  render(<MemoryRouter><PlanPurchaseButton plan={plan}/></MemoryRouter>); const user=userEvent.setup();
  await user.click(screen.getByRole("button",{ name:"Comprar plan (simulado)" }));
  await user.click(screen.getByRole("button",{ name:"Confirmar compra simulada" }));
  await waitFor(()=>expect(state.purchase).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button",{ name:"Cancelar" }));
  await user.click(screen.getByRole("button",{ name:"Comprar plan (simulado)" }));
  await user.click(screen.getByRole("button",{ name:"Confirmar compra simulada" }));
  await waitFor(()=>expect(state.purchase).toHaveBeenCalledTimes(2));
  expect(state.purchase.mock.calls[0][0].idempotencyKey).toBe(state.purchase.mock.calls[1][0].idempotencyKey);
 });
 it("requires a new confirmation after the connection comes back", async () => {
  const connected = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  render(<MemoryRouter><PlanPurchaseButton plan={plan} /></MemoryRouter>);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Comprar plan (simulado)" }));
  connected.mockReturnValue(false);
  act(() => { window.dispatchEvent(new Event("offline")); });
  const confirm = screen.getByRole("button", { name: "Confirmar compra simulada" });
  expect(confirm).toBeDisabled();
  expect(screen.getByRole("dialog")).toHaveTextContent("Conéctate a internet");
  connected.mockReturnValue(true);
  act(() => { window.dispatchEvent(new Event("online")); });
  expect(confirm).toBeEnabled();
  expect(state.purchase).not.toHaveBeenCalled();
 });
});
