/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom/extend-expect";
import { screen } from "@testing-library/dom";
import Actions from "../views/Actions.js";

describe("Given I am connected as an Employee", () => {
  describe("When I am on Bills page and there are bills", () => {
    //Quand je suis sur la page Factures et qu'il y a des factures
    test("Then, it should render icon eye", () => {
      //Alors, il devrait afficher un icône oeil
      const html = Actions();
      document.body.innerHTML = html;
      expect(screen.getByTestId("icon-eye")).toBeTruthy();
    });
  });
  describe("When I am on Bills page and there are bills with url for file", () => {
    //Quand je suis sur la page Factures et qu'il y a des factures avec l'URL du fichier
    test("Then, it should save given url in data-bill-url custom attribute", () => {
      //Alors, il doit enregistrer l'URL donnée dans l'attribut personnalisé data-bill-url
      const url = "/fake_url";
      const html = Actions(url);
      document.body.innerHTML = html;
      expect(screen.getByTestId("icon-eye")).toHaveAttribute(
        "data-bill-url",
        url
      );
    });
  });
});
