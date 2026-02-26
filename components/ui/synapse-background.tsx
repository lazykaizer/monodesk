"use client";

import React, { useRef, useEffect, ReactNode } from 'react'
import * as THREE from 'three'

export interface SynapseBackgroundProps {
    children?: ReactNode
    particleCount?: number
    lineColor?: number
    particleColor?: number
    pulseColor?: number
    connectionDistance?: number
    width?: number
    height?: number
    ariaLabel?: string
    className?: string
    visible?: boolean
}

const SynapseBackground = React.memo(({
    children,
    particleCount = 5000,
    lineColor = 0x00ffff,
    particleColor = 0xffffff,
    pulseColor = 0xff00ff,
    connectionDistance = 80,
    width,
    height,
    ariaLabel = 'Interactive 3D synapse network background',
    className = '',
    visible = true
}: SynapseBackgroundProps) => {
    const mountRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

    useEffect(() => {
        if (!mountRef.current) return

        // Cleanup any existing canvas from previous mounts to prevent duplication/stalls
        const existingCanvas = mountRef.current.querySelector('canvas')
        if (existingCanvas) {
            mountRef.current.removeChild(existingCanvas)
        }

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            1000
        )
        camera.position.z = 250

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        mountRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Build particles
        const positions = new Float32Array(particleCount * 3)
        const colors = new Float32Array(particleCount * 3)
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = Math.random() * 800 - 400
            positions[i * 3 + 1] = Math.random() * 800 - 400
            positions[i * 3 + 2] = Math.random() * 800 - 400
            const c = new THREE.Color(particleColor)
            colors[i * 3] = c.r
            colors[i * 3 + 1] = c.g
            colors[i * 3 + 2] = c.b
        }
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const pts = new THREE.Points(
            geo,
            new THREE.PointsMaterial({
                size: 2,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                transparent: true,
                sizeAttenuation: true,
            })
        )
        scene.add(pts)

        // Build lines
        const linePos: number[] = []
        const pArr = geo.attributes.position.array as Float32Array
        for (let i = 0; i < particleCount; i++) {
            for (let j = i + 1; j < particleCount; j++) {
                const dx = pArr[i * 3] - pArr[j * 3]
                const dy = pArr[i * 3 + 1] - pArr[j * 3 + 1]
                const dz = pArr[i * 3 + 2] - pArr[j * 3 + 2]
                if (Math.hypot(dx, dy, dz) < connectionDistance) {
                    linePos.push(
                        pArr[i * 3],
                        pArr[i * 3 + 1],
                        pArr[i * 3 + 2],
                        pArr[j * 3],
                        pArr[j * 3 + 1],
                        pArr[j * 3 + 2]
                    )
                }
            }
        }
        const lineGeo = new THREE.BufferGeometry()
        lineGeo.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(linePos), 3)
        )
        const lines = new THREE.LineSegments(
            lineGeo,
            new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.05 })
        )
        scene.add(lines)

        // Mouse pulse vector
        const mouse = new THREE.Vector2(-100, -100)
        const onMouseMove = (e: MouseEvent) => {
            if (!mountRef.current) return
            const rect = mountRef.current.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        }
        mountRef.current.addEventListener('mousemove', onMouseMove)

        // Resize handler
        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', onResize)

        // Animation loop control
        let animationFrameId: number;

        // Animation
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate)

            // If not visible, just render and return to keep loop alive but minimize heavy logic
            if (!visible) {
                renderer.render(scene, camera)
                return
            }

            scene.rotation.y += 0.0002
            scene.rotation.x += 0.0001

            // Pulse effect
            const mv = new THREE.Vector3(mouse.x, mouse.y, 0.5)
                .unproject(camera)
                .sub(camera.position)
                .normalize()
            const dist = -camera.position.z / mv.z
            const ptr = camera.position.clone().add(mv.multiplyScalar(dist))

            const colArr = geo.attributes.color.array as Float32Array
            const base = new THREE.Color(particleColor)
            const pulseClr = new THREE.Color(pulseColor)
            for (let i = 0; i < particleCount; i++) {
                const dx = pArr[i * 3] - ptr.x
                const dy = pArr[i * 3 + 1] - ptr.y
                const t = Math.max(0, 1 - Math.hypot(dx, dy) / 100)
                const mix = base.clone().lerp(pulseClr, t)
                const curr = new THREE.Color().fromArray(colArr, i * 3)
                curr.lerp(mix, 0.1).toArray(colArr, i * 3)
            }
            geo.attributes.color.needsUpdate = true

            renderer.render(scene, camera)
        }
        animate()

        return () => {
            mountRef.current?.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
            cancelAnimationFrame(animationFrameId)

            if (rendererRef.current) {
                rendererRef.current.dispose()
                const canvasEl = mountRef.current?.querySelector('canvas')
                if (canvasEl) mountRef.current!.removeChild(canvasEl)
                rendererRef.current = null
            }
        }
    }, [
        particleCount,
        lineColor,
        particleColor,
        pulseColor,
        connectionDistance,
        width,
        height,
        visible,
    ])

    return (
        <div
            role="img"
            aria-label={ariaLabel}
            className={`relative w-full h-full overflow-hidden bg-transparent ${className}`}
            style={{ width: width ?? '100%', height: height ?? '100%' }}
        >
            <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />
            <div className="relative z-10 w-full h-full">{children}</div>
        </div>
    )
});

SynapseBackground.displayName = 'SynapseBackground';

export default SynapseBackground;
