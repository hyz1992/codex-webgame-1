import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LANE_X } from '../config';
import type { LaneItem } from '../spawn/patterns';
import type { PlayerVisual } from './GameVisualFactory';
import { getLaneItemVisual, neonSunsetTheme } from './theme';

export class EffectController {
  private speedLines: Phaser.GameObjects.Rectangle[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  createSpeedLines(): void {
    for (let index = 0; index < 10; index += 1) {
      const x = index % 2 === 0 ? 28 : GAME_WIDTH - 28;
      const y = 42 + index * 84;
      const line = this.scene.add.rectangle(x, y, 2, 54, neonSunsetTheme.colors.laneCyan, 0);
      line.setDepth(2);
      this.speedLines.push(line);
    }
  }

  updateBoost(isBoosting: boolean): void {
    for (const [index, line] of this.speedLines.entries()) {
      line.setAlpha(isBoosting ? 0.22 + (index % 3) * 0.08 : 0);
      line.y += isBoosting ? 12 : 0;
      if (line.y > GAME_HEIGHT + 50) {
        line.y = -40;
      }
    }
  }

  playLaneChange(player: PlayerVisual, lane: number): void {
    const laneFlash = this.scene.add.rectangle(
      LANE_X[lane],
      GAME_HEIGHT - 132,
      78,
      80,
      neonSunsetTheme.colors.laneCyan,
      0.18,
    );
    laneFlash.setDepth(3);
    this.scene.tweens.add({
      targets: laneFlash,
      alpha: 0,
      scaleY: 1.6,
      duration: neonSunsetTheme.motion.laneTweenMs,
      onComplete: () => laneFlash.destroy(),
    });

    this.scene.tweens.add({
      targets: player.container,
      angle: lane === 0 ? -8 : lane === 2 ? 8 : 0,
      duration: 70,
      yoyo: true,
    });
  }

  playPickup(item: LaneItem, x: number, y: number): void {
    const visual = getLaneItemVisual(item.kind);
    const flash = this.scene.add.circle(x, y, 18, Number(visual.glow), 0.45);
    flash.setDepth(5);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.8,
      duration: neonSunsetTheme.motion.pickupMs,
      onComplete: () => flash.destroy(),
    });
  }

  playShield(player: PlayerVisual): void {
    player.shieldRing.setAlpha(0.95);
    this.scene.tweens.add({
      targets: player.shieldRing,
      alpha: 0,
      scale: 1.35,
      duration: neonSunsetTheme.motion.shieldMs,
      onComplete: () => player.shieldRing.setScale(1),
    });
  }

  playImpact(player: PlayerVisual): void {
    this.scene.cameras.main.shake(neonSunsetTheme.motion.impactShakeMs, 0.006);
    this.scene.tweens.add({
      targets: player.sprite ?? player.core,
      alpha: 0.2,
      duration: 55,
      yoyo: true,
      repeat: 2,
    });
  }

  playGameOver(x: number, y: number): void {
    const blast = this.scene.add.circle(x, y, 22, 0xef476f, 0.5);
    blast.setDepth(5);
    this.scene.tweens.add({
      targets: blast,
      alpha: 0,
      scale: 2.4,
      duration: neonSunsetTheme.motion.gameOverMs,
      onComplete: () => blast.destroy(),
    });
  }
}
