import React from "react";
import { Composition, Folder } from "remotion";
import { MainComposition } from "./compositions/MainComposition";
import { Scene1Intro } from "./compositions/scenes/Scene1Intro";
import { Scene2CreateStore } from "./compositions/scenes/Scene2CreateStore";
import { Scene3AddProduct } from "./compositions/scenes/Scene3AddProduct";
import { Scene4Order } from "./compositions/scenes/Scene4Order";
import { Scene5Delivery } from "./compositions/scenes/Scene5Delivery";
import { Scene6Dashboard } from "./compositions/scenes/Scene6Dashboard";
import { Scene7Outro } from "./compositions/scenes/Scene7Outro";
import { WIDTH, HEIGHT, FPS, DURATION_IN_FRAMES, SCENES } from "./config";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full video — 45s */}
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Individual scenes for isolated preview/rendering */}
      <Folder name="Scenes">
        <Composition
          id="Scene1Intro"
          component={Scene1Intro}
          durationInFrames={SCENES.intro.end - SCENES.intro.start}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene2CreateStore"
          component={Scene2CreateStore}
          durationInFrames={SCENES.createStore.end - SCENES.createStore.start}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene3AddProduct"
          component={Scene3AddProduct}
          durationInFrames={SCENES.addProduct.end - SCENES.addProduct.start}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene4Order"
          component={Scene4Order}
          durationInFrames={SCENES.order.end - SCENES.order.start}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene5Delivery"
          component={Scene5Delivery}
          durationInFrames={SCENES.delivery.end - SCENES.delivery.start}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene6Dashboard"
          component={Scene6Dashboard}
          durationInFrames={SCENES.dashboard.end - SCENES.dashboard.start}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Scene7Outro"
          component={Scene7Outro}
          durationInFrames={SCENES.outro.end - SCENES.outro.start}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
    </>
  );
};
