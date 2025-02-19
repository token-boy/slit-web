import { isMobileDevice } from '@/lib/utils'

/**
 * Get the size of the game scene.
 *
 * The size object contains the width and height of the game, as well as a scale factor.
 * The scale factor is calculated by dividing the width of the game by 3840.
 * If the game is running on a mobile device, the width and height are swapped and
 * the scale factor is recalculated.
 *
 * @param scene The Phaser scene.
 * @returns The size of the game scene.
 */
export function getSize(scene: Phaser.Scene) {
  const size = {
    width: scene.sys.game.config.width as number,
    height: scene.sys.game.config.height as number,
    scale: (scene.sys.game.config.width as number) / 3840,
  }
  if (isMobileDevice()) {
    ;[size.width, size.height, size.scale] = [
      size.height,
      size.width,
      size.height / 3840,
    ]
  }
  return size
}

/**
 * Clips the given canvas texture to have rounded corners with the specified radius.
 *
 * This function modifies the provided canvas texture by creating a path with
 * rounded corners and applying it as a clipping region. The clipping region is
 * defined using a series of arcTo operations to smoothly round each corner.
 *
 * @param canvas The Phaser canvas texture to modify.
 * @param radius The radius of the rounded corners.
 */
export function drawRoundedCorner(
  canvas: Phaser.Textures.CanvasTexture,
  radius: number
) {
  const ctx = canvas.getContext()
  const width = canvas.width
  const height = canvas.height

  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.arcTo(width, 0, width, height, radius)
  ctx.arcTo(width, height, 0, height, radius)
  ctx.arcTo(0, height, 0, 0, radius)
  ctx.arcTo(0, 0, width, 0, radius)
  ctx.closePath()
  ctx.clip()
}
