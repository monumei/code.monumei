import { useEffect, useState, useRef, type CSSProperties } from 'react'

import domToImage from 'dom-to-image'
import { Image, ArrowDownToLine, Brush, Minus, X, Square } from 'lucide-react'

import { codeToHtml } from 'shiki'
import { useLocalStorage } from 'react-use'

import { defaultCode, fonts, languages, themes } from './constant'
import { isLight } from './utils/luma'
import { compressImage } from './utils/compress'
import clsx from 'clsx'

export default function ShikiEditor() {
	const [code, setCode] = useLocalStorage('code', defaultCode)
	const [html, setHtml] = useState('')
	const [backgroundColor, setBackgroundColor] = useState('')

	const codeRef = useRef<HTMLDivElement>(null)
	const fileElementRef = useRef<HTMLInputElement>(null)

	const [language, setLanguage] = useLocalStorage<string>('language')
	const [theme, setTheme] = useLocalStorage<string>('theme')
	const [font, setFont] = useLocalStorage<string>('font')
	const [scale, setScale] = useLocalStorage<number>('scale')
	const [spacing, setSpacing] = useLocalStorage<number>('spacing')
	const [blur, setBlur] = useLocalStorage<number>('blur')
	const [layout, setLayout] = useLocalStorage<number>('layout', 1)
	const [opacity, setOpacity] = useLocalStorage<number>('opacity', 0.8)
	const [title, setTitle] = useLocalStorage<string>('title')
	const [background, setBackground] = useLocalStorage<string>('background')

	const [colorScheme, setColorScheme] = useLocalStorage<'light' | 'dark'>(
		'color-scheme',
		'dark'
	)
	
	const [pos, setPos] = useState({ x: 0, y: 0 })
	const [isDragging, setIsDragging] = useState(false)
	const dragStart = useRef({ x: 0, y: 0 })

	const [viewScale, setViewScale] = useState(1)

	useEffect(() => {
		codeToHtml(code ? code + ' ' : '', {
			lang: language ?? 'tsx',
			theme: theme ?? 'catppuccin-mocha'
		}).then((html) => {
			const value = html.match(/background-color:#([a-zA-Z0-9]{6})/gs)
			if (!value) return

			const color = value[0].replace('background-color:', '')
			setBackgroundColor(color)
			setColorScheme(isLight(color) ? 'light' : 'dark')

			setHtml(html)
		})
	}, [language, code, theme, setColorScheme])

	useEffect(() => {
		if (theme) return

		const systemPrefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)'
		).matches

		setTheme(systemPrefersDark ? 'catppuccin-mocha' : 'catppuccin-latte')
	}, [])

	useEffect(() => {
		if (colorScheme === 'dark')
			document.documentElement.classList.add('dark')
		else document.documentElement.classList.remove('dark')
	}, [colorScheme])

	function saveImage() {
		if (!codeRef.current) return

		domToImage
			.toJpeg(codeRef.current, {
				quality: 1,
				width: codeRef.current.clientWidth * 4,
				height: codeRef.current.clientHeight * 4,
				style: {
					transform: 'scale(4)',
					transformOrigin: 'top left'
				}
			})
			.then((dataUrl) => {
				const link = document.createElement('a')
				link.download = 'code-monumei.jpg'
				link.href = dataUrl
				link.click()
			})
	}

	return (
		<>
			<main
				className={clsx(
					'fixed inset-0 flex justify-center items-center w-full min-h-dvh pt-8 pb-48 overflow-hidden select-none',
					isDragging ? 'cursor-grabbing' : 'cursor-grab'
				)}
				onPointerDown={(e) => {
					if (
						['textarea', 'input', 'select', 'button', 'label'].includes(
							(e.target as HTMLElement).tagName.toLowerCase()
						)
					)
						return
					setIsDragging(true)
					dragStart.current = {
						x: e.clientX - pos.x,
						y: e.clientY - pos.y
					}
				}}
				onPointerMove={(e) => {
					if (!isDragging) return
					e.preventDefault()
					setPos({
						x: e.clientX - dragStart.current.x,
						y: e.clientY - dragStart.current.y
					})
				}}
				onPointerUp={() => setIsDragging(false)}
				onPointerLeave={() => setIsDragging(false)}
				onWheel={(e) => {
					if (e.ctrlKey || e.metaKey) {
						e.preventDefault()
						const delta = e.deltaY * -0.001
						setViewScale((prev) => Math.min(Math.max(0.1, prev + delta), 4))
					}
				}}
			>
				<div
					style={{
						transform: `translate(${pos.x}px, ${pos.y}px) scale(${viewScale})`,
						transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0,0,0.2,1)'
					}}
				>
					{!html ? (
						<Brush
							size={36}
							strokeWidth={1}
							className="text-neutral-300 dark:text-neutral-700 animate-pulse"
						/>
					) : (
						<section className="border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden shadow-2xl shadow-black/5">
							<div
								ref={codeRef}
								className="relative min-w-52 max-w-7xl"
								style={{
									padding: `${spacing || 48}px`
								}}
							>
								<div
									className="absolute inset-1/2 -translate-1/2 w-7xl h-full bg-center bg-no-repeat"
									style={{
										backgroundImage: `url(${background ?? '/images/target-for-love.webp'})`,
										backgroundSize: 'cover',
										backgroundRepeat: 'no-repeat',
										scale: scale ?? 1.25
									}}
								/>

								<section
									className={clsx(
										'relative text-lg font-mono rounded-2xl shadow-xl'
									)}
									style={
										Object.assign(
											{
												backgroundColor,
												'--tw-shadow-color': `rgba(0,0,0,${(opacity ?? 0.7) * 0.1})`
											},
											font
												? {
														// @ts-ignore
														'--font-mono': font
													}
												: {}
										) as CSSProperties
									}
								>
									<header className="absolute top-2 w-full z-10 flex items-center px-2">
										{layout === 2 && (
											<input
												type="text"
												placeholder="code.monumei"
												value={title ?? ''}
												onChange={(e) =>
													setTitle(e.target.value)
												}
												className="w-full text-center text-sm bg-transparent outline-none text-neutral-500/65 placeholder:text-neutral-500/65 dark:text-neutral-300/65 dark:placeholder:text-neutral-300/65"
											/>
										)}

										{layout === 3 && (
											<>
												<div
													className="absolute left-3 size-3.5 rounded-full"
													style={{
														backgroundColor: '#FF605C'
													}}
												/>
												<div
													className="absolute left-8.5 size-3.5 rounded-full"
													style={{
														backgroundColor: '#FFBD44'
													}}
												/>
												<div
													className="absolute left-14 size-3.5 rounded-full"
													style={{
														backgroundColor: '#00CA4E'
													}}
												/>

												<input
													type="text"
													placeholder="code.monumei"
													value={title ?? ''}
													onChange={(e) =>
														setTitle(e.target.value)
													}
													className="w-full text-center text-sm bg-transparent outline-none text-neutral-500/65 placeholder:text-neutral-500/65 dark:text-neutral-300/65 dark:placeholder:text-neutral-300/65"
												/>
											</>
										)}

										{layout === 4 && (
											<>
												<X
													className="absolute right-3.5 text-neutral-600 dark:text-neutral-300/80"
													size={16}
													strokeWidth={1.5}
												/>
												<Square
													className="absolute right-12 text-neutral-600 dark:text-neutral-300/80"
													size={12}
													strokeWidth={1.75}
												/>
												<Minus
													className="absolute right-20 text-neutral-600 dark:text-neutral-300/80"
													size={16}
													strokeWidth={1.5}
												/>

												<input
													type="text"
													placeholder="code.monumei"
													value={title ?? ''}
													onChange={(e) =>
														setTitle(e.target.value)
													}
													className="w-full text-center text-sm bg-transparent outline-none text-neutral-500/65 placeholder:text-neutral-500/65 dark:text-neutral-300/65 dark:placeholder:text-neutral-300/65"
												/>
											</>
										)}

										{layout === 5 && (
											<>
												<X
													className="absolute right-3.5 text-neutral-600 dark:text-neutral-300/80"
													size={16}
													strokeWidth={1.5}
												/>
												<Square
													className="absolute right-12 text-neutral-600 dark:text-neutral-300/80"
													size={12}
													strokeWidth={1.75}
												/>
												<Minus
													className="absolute right-20 text-neutral-600 dark:text-neutral-300/80"
													size={16}
													strokeWidth={1.5}
												/>

												<input
													type="text"
													placeholder="code.monumei"
													value={title ?? ''}
													onChange={(e) =>
														setTitle(e.target.value)
													}
													className="w-full text-left px-2 text-sm bg-transparent outline-none text-neutral-500/65 placeholder:text-neutral-500/65 dark:text-neutral-300/65 dark:placeholder:text-neutral-300/65"
												/>
											</>
										)}
									</header>

									<textarea
										className={clsx(
											'absolute left-0 px-4 z-20 w-full caret-blue-400 text-transparent bg-transparent resize-none border-0 outline-0 whitespace-nowrap overflow-hidden',
											layout === 1 ? 'mt-4' : 'mt-9'
										)}
										style={{
											height: `calc(100% - ${layout === 1 ? 0.5 : 2}rem)`
										}}
										value={code}
										onChange={(e) => setCode(e.target.value)}
										spellCheck={false}
										onKeyDown={(event) => {
											// handle tab
											if (event.key === 'Tab') {
												event.preventDefault()
												const target = event.currentTarget
												const start = target.selectionStart
												const end = target.selectionEnd
												const newValue =
													target.value.substring(
														0,
														start
													) +
													'\t' +
													target.value.substring(end)

												setCode(newValue)
												// move cursor
												setTimeout(() => {
													target.selectionStart =
														target.selectionEnd =
															start + 1
												}, 0)
											}
										}}
										data-gramm="false"
									/>

									<div className="relative overflow-hidden rounded-xl">
										<div
											className={clsx(
												'relative z-10 px-4 pb-4 whitespace-nowrap overflow-hidden pointer-events-none *:min-w-52 *:min-h-7 **:font-normal! *:bg-transparent! *:rounded-2xl **:not-italic! **:font-mono!',
												layout === 1 ? 'pt-4' : 'pt-9'
											)}
											dangerouslySetInnerHTML={{
												__html: html
											}}
										/>
										<div
											className="absolute z-0 inset-1/2  -translate-1/2 w-7xl h-full bg-center bg-no-repeat scale-100 pointer-events-none"
											style={{
												backgroundImage: `url(${background ?? '/images/target-for-love.webp'})`,
												backgroundSize: 'cover',
												backgroundRepeat: 'no-repeat',
												scale: scale ?? 1.25,
												filter: `blur(${blur ?? 10}px)`,
												opacity: 1 - (opacity ?? 0.8)
											}}
										/>
									</div>
								</section>
							</div>
						</section>
					)}
				</div>
			</main>
			<aside className="fixed z-30 left-1/2 bottom-8 flex flex-col gap-3 -translate-x-1/2 p-3 text-sm text-neutral-700 dark:text-neutral-300 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/20 shadow-2xl shadow-black/10 animate-in fade-in slide-in-from-bottom-8 duration-500 after:absolute after:inset-0 after:rounded-[32px] after:bg-gradient-to-b after:from-white/40 after:to-transparent after:pointer-events-none dark:after:from-white/10">
				
				{/* Top Row: Controls */}
				<div className="flex items-center gap-4 px-2">
					{/* Layout */}
					<div className="flex items-center gap-0.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
						{[1, 2, 3, 4, 5].map((key) => (
							<button
								key={key}
								className={clsx(
									'relative flex justify-center items-center size-6 interact:scale-110 rounded-lg transition-all cursor-pointer text-xs overflow-hidden',
									key == layout
										? 'bg-sky-400 text-white shadow-lg shadow-sky-400/20'
										: 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
								)}
								onClick={() => setLayout(key)}
								title={`Layout ${key}`}
							>
								{key}
								{key === layout && (
									<div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
								)}
							</button>
						))}
					</div>

					<div className="w-px h-6 bg-neutral-900/10 dark:bg-white/10" />

					{/* Sliders */}
					<label className="flex flex-col gap-1 min-w-28 group">
						<span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium ml-0.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">Scale</span>
						<div className="flex items-center gap-2">
							<input
								type="range"
								min="0"
								max="2"
								step="0.05"
								value={scale ?? 1.25}
								onChange={(e) => setScale(parseFloat(e.target.value))}
								className="w-16 accent-sky-400 h-4"
							/>
							<input
								type="number"
								name="scale"
								min="0"
								step="0.05"
								value={scale ?? ''}
								className="w-10 bg-transparent outline-none font-medium tabular-nums text-right"
								onChange={(e) => {
									let n = parseFloat(e.currentTarget.value)
									if (isNaN(n) || n < 0) return
									setScale(n)
								}}
							/>
						</div>
					</label>

					<label className="flex flex-col gap-1 min-w-28 group">
						<span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium ml-0.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">Spacing</span>
						<div className="flex items-center gap-2">
							<input
								type="range"
								min="0"
								max="480"
								step="4"
								value={spacing ?? 48}
								onChange={(e) => setSpacing(parseFloat(e.target.value))}
								className="w-16 accent-sky-400 h-4"
							/>
							<input
								type="tel"
								value={spacing ?? ''}
								className="w-8 bg-transparent outline-none font-medium tabular-nums text-right"
								onChange={(e) => {
									let n = parseFloat(e.currentTarget.value)
									if (isNaN(n)) return
									setSpacing(n)
								}}
							/>
						</div>
					</label>

					<label className="flex flex-col gap-1 min-w-28 group">
						<span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium ml-0.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">Blur</span>
						<div className="flex items-center gap-2">
							<input
								type="range"
								min="0"
								max="40"
								step="1"
								value={blur ?? 10}
								onChange={(e) => setBlur(parseFloat(e.target.value))}
								className="w-16 accent-sky-400 h-4"
							/>
							<input
								type="number"
								value={blur ?? ''}
								className="w-8 bg-transparent outline-none font-medium tabular-nums text-right"
								onChange={(e) => {
									let n = parseFloat(e.currentTarget.value)
									if (isNaN(n)) return
									setBlur(n)
								}}
							/>
						</div>
					</label>

					<label className="flex flex-col gap-1 min-w-28 group">
						<div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium ml-0.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
							<span>Opacity</span>
							<span>{opacity}</span>
						</div>
						<input
							type="range"
							min="0"
							max="1"
							step="0.05"
							value={opacity}
							className="accent-sky-400 h-4 w-full"
							onChange={(e) => setOpacity(parseFloat(e.target.value))}
						/>
					</label>
				</div>

				{/* Bottom Row: Content & Meta */}
				<div className="flex items-center gap-4 px-2">
					<button
						className="flex justify-center items-center size-10 interact:bg-black/5 dark:interact:bg-white/10 interact:scale-105 rounded-xl transition-all cursor-pointer text-neutral-600 dark:text-neutral-300"
						onClick={() => fileElementRef.current?.click()}
						title="Change Background"
					>
						<Image size={20} strokeWidth={1.5} />
					</button>
					<input
						ref={fileElementRef}
						className="hidden"
						type="file"
						accept="image"
						onInput={async (image) => {
							const file = image.currentTarget.files?.[0]
							if (!file) return
							setBackground(await compressImage(file))
						}}
					/>

					<div className="w-px h-6 bg-neutral-900/10 dark:bg-white/10" />

					<label className="flex flex-col gap-1 min-w-24 flex-1">
						<span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium ml-0.5">Title</span>
						<input
							type="text"
							value={title ?? ''}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="code monumei"
							className="w-full bg-transparent outline-none font-medium text-sm"
						/>
					</label>

					<label className="flex flex-col gap-1 min-w-24">
						<span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium ml-0.5">Lang</span>
						<select
							value={language ?? 'tsx'}
							onChange={(e) => setLanguage(e.target.value)}
							className="w-full bg-transparent outline-none font-medium text-sm appearance-none cursor-pointer"
						>
							{languages.map((l) => (
								<option key={l} value={l}>{l}</option>
							))}
						</select>
					</label>

					<label className="flex flex-col gap-1 min-w-24">
						<span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium ml-0.5">Theme</span>
						<select
							value={theme ?? 'catppuccin-latte'}
							onChange={(e) => setTheme(e.target.value)}
							className="w-full bg-transparent outline-none font-medium text-sm appearance-none cursor-pointer"
						>
							{themes.map((t) => (
								<option key={t} value={t}>{t}</option>
							))}
						</select>
					</label>

					<label className="flex flex-col gap-1 min-w-32">
						<span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium ml-0.5">Font</span>
						<select
							value={font ?? 'JetBrains Mono'}
							onChange={(e) => setFont(e.target.value)}
							className="w-full bg-transparent outline-none font-medium text-sm appearance-none cursor-pointer"
						>
							{fonts.map((f) => (
								<option key={f} value={f}>{f}</option>
							))}
						</select>
					</label>

					<div className="w-px h-6 bg-neutral-900/10 dark:bg-white/10" />

					<button
						className="flex justify-center items-center size-10 bg-sky-400 hover:bg-sky-500 text-white shadow-lg shadow-sky-400/30 interact:scale-105 rounded-xl transition-all cursor-pointer"
						onClick={saveImage}
						title="Save"
					>
						<ArrowDownToLine size={20} strokeWidth={2} />
					</button>
				</div>
			</aside>
		</>
	)
}
