import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2CreateStore } from "./scenes/Scene2CreateStore";
import { Scene3AddProduct } from "./scenes/Scene3AddProduct";
import { Scene4Order } from "./scenes/Scene4Order";
import { Scene5Delivery } from "./scenes/Scene5Delivery";
import { Scene6Dashboard } from "./scenes/Scene6Dashboard";
import { Scene7Outro } from "./scenes/Scene7Outro";
import { SCENES, COLORS } from "../config";

// MainComposition — 1350 frames (45s at 30fps)
// Each Sequence remaps useCurrentFrame() to local 0 inside the scene component.

export const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      {/* Scene 1 — Intro [0→60] */}
      <Sequence
        from={SCENES.intro.start}
        durationInFrames={SCENES.intro.end - SCENES.intro.start}
        premountFor={10}
      >
        <Scene1Intro />
      </Sequence>

      {/* Scene 2 — Création boutique [60→180] */}
      <Sequence
        from={SCENES.createStore.start}
        durationInFrames={SCENES.createStore.end - SCENES.createStore.start}
        premountFor={15}
      >
        <Scene2CreateStore />
      </Sequence>

      {/* Scene 3 — Ajout produit [180→420] */}
      <Sequence
        from={SCENES.addProduct.start}
        durationInFrames={SCENES.addProduct.end - SCENES.addProduct.start}
        premountFor={15}
      >
        <Scene3AddProduct />
      </Sequence>

      {/* Scene 4 — Commande reçue [420→660] */}
      <Sequence
        from={SCENES.order.start}
        durationInFrames={SCENES.order.end - SCENES.order.start}
        premountFor={15}
      >
        <Scene4Order />
      </Sequence>

      {/* Scene 5 — Livraison [660→900] */}
      <Sequence
        from={SCENES.delivery.start}
        durationInFrames={SCENES.delivery.end - SCENES.delivery.start}
        premountFor={15}
      >
        <Scene5Delivery />
      </Sequence>

      {/* Scene 6 — Dashboard [900→1140] */}
      <Sequence
        from={SCENES.dashboard.start}
        durationInFrames={SCENES.dashboard.end - SCENES.dashboard.start}
        premountFor={15}
      >
        <Scene6Dashboard />
      </Sequence>

      {/* Scene 7 — Outro/CTA [1140→1350] */}
      <Sequence
        from={SCENES.outro.start}
        durationInFrames={SCENES.outro.end - SCENES.outro.start}
        premountFor={15}
      >
        <Scene7Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
