<script lang="ts">
  import AnimatedLayer from './AnimatedLayer.svelte';
</script>

<AnimatedLayer
  name="Circle"
  render={({ ctx, renderer, width, height, active }) => {
    ctx.translate(width * 0.15, height * 0.7);
    renderer.fillCircle({ x: 0, y: 0, radius: width * 0.1, color: '#ffd670' });

    if (active()) {
      ctx.stroke();
    }
  }}
/>
