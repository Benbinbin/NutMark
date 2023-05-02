<script setup>
import { Icon as Iconify } from '@iconify/vue';
</script>

<template>
  <div class="py-8">
    <header class="heading-container-bg-color px-4 py-36 sm:py-52 lg:py-60 space-y-6">
      <h1 class="flex justify-center items-center gap-4">
        <img src="@/assets/nut-mark.svg" alt="nut mark icon" class="w-12 sm:w-24 h-12 sm:h-24">
        <span class="text-5xl sm:text-8xl text-center text-amber-500 font-bold">Nut Mark</span>
      </h1>
      <p class="text-xl sm:text-3xl text-center text-amber-500 font-light">Make Bookmarking a Breeze</p>
    </header>
    <main class="container mx-auto px-8 sm:px-16 md:px-20 py-16 space-y-8 sm:space-y-16 text-gray-600">
      <section>
        <h2>Why call "Nut Mark"</h2>
        <p>I like to collect and organize bookmarks like a squirrel hoards nuts, so I build this browser
          extension and call it "Nut Mark".</p>
      </section>
      <section>
        <h2>Feature</h2>
        <p>Nut Mark focus on collecting bookmarks with the following features to make the process more smoothly and easily:</p>
        <div class="ml-4 sm:ml-10 my-4 font-bold text-[#f9c23c] space-y-3">
          <p class="flex justify-start items-center gap-2">
            <Iconify icon="fluent-emoji-flat:sparkles" class="shrink-0 w-5 h-5"></Iconify>
            <span>Clean "dirty" URL with one click</span>
          </p>
          <p class="flex justify-start items-start gap-2">
            <Iconify icon="fluent-emoji-flat:sparkles" class="shrink-0 w-5 h-5"></Iconify>
            <span>Navigate freely through the directory tree</span>
          </p>
          <p class="flex justify-start items-start gap-2">
            <Iconify icon="fluent-emoji-flat:sparkles" class="shrink-0 w-5 h-5"></Iconify>
            <span>Quick search to find the directory to hold the bookmark</span>
          </p>
        </div>
      </section>
      <section>
        <h2>How to use</h2>
        <div>
          <h3>Icon</h3>
          <p>the icon for the Nut Mark extension on the right corner of the browser is a <span class="text-emerald-500 font-bold">Green</span> or <span class="text-amber-500 font-bold">Orange</span> <span class="font-bold">Nut</span>, which color has a special meaning about the bookmark state of the active tab:</p>
          <p class="m-2 px-4 py-2 flex justify-start items-center gap-4 border border-emerald-300 rounded-md">
            <img src="@/assets/nut-unmark.svg" alt="a green nut image stand for unmark" class="w-5 h-5">
            <span>The <span class="text-emerald-500 font-bold">Green Nut</span> icon stands for the current active tab is still <span class="text-emerald-500 font-bold">unsaved</span> as a bookmark.</span>
          </p>
          <p class="m-2 px-4 py-2 flex justify-start items-center gap-4 border border-amber-300 rounded-md">
            <img src="@/assets/nut-mark.svg" alt="a green nut image stand for unmark" class="w-5 h-5">
            <span>The <span class="text-amber-500 font-bold">Orange Nut</span> icon stands for the current active tab already <span class="text-amber-500 font-bold">saves</span> as a bookmark.</span>
          </p>
          <div class="flex justify-center items-center">
            <div class="w-fit ">
              <div class="p-2">
                <figure class="my-2">
                  <img src="@/assets/introduction/pin-extension.gif" alt="the gif image to show how to pin a extension to browser tool bar" class="lg:w-3/5 mx-auto py-2">
                  <figcaption class="flex justify-center items-center gap-1 text-sm text-center text-amber-500 italic">
                    <Iconify icon="bi:lightbulb-fill" class="w-3 h-3"></Iconify>
                    <span>Tip:</span>
                    <span>please <span class="font-bold">Pin</span> the Nut Mark after install the extension</span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.heading-container-bg-color {
  background: radial-gradient(37.79% 37.79% at 50% 62.21%, rgba(252, 211, 77, 0.2) 0%, rgba(253, 230, 138, 0.02) 100%);
}

h2 {
  @apply my-8 text-3xl text-center font-bold ;
}

h3 {
  @apply my-6 text-2xl text-center font-bold;
}

section P {
  @apply max-w-prose mx-auto;
}

p {
  @apply text-lg;
}

.tip-box {
  @apply m-8 px-4 lg:px-6 py-4 border rounded-md;
}
</style>
