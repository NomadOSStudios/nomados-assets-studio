#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

// Put this script in an Editor folder. Select the exported manifest first.
public static class UIMAssetImporter
{
    [Serializable] private class Body { public float x, y, width, height; }
    [Serializable] private class Entry { public string file; public string name; public string state; public int width, height; public float left, bottom, right, top; public Body body; }
    [Serializable] private class TextInfo { public string kind; public string content; public float fontSize; public string color; public string align; public bool bold; public float lineHeight; public string font; }
    [Serializable] private class Placement { public string name; public string kind; public string file; public float x, y, width, height; public string group; public TextInfo text; }
    [Serializable] private class Screen { public string name; public float width, height; public Placement[] assets; }
    [Serializable] private class Manifest { public int version; public float scale; public float pixelsPerUnit; public Entry[] assets; public Screen screen; public Screen[] screens; }

    [MenuItem("Tools/UIM Studio/Apply sprite settings")]
    public static void ApplySpriteSettings()
    {
        var manifest = Load(out var folder);
        if (manifest == null) return;
        try { Debug.Log("UIM Studio: configured " + Apply(manifest, folder) + " sprites."); }
        catch (Exception exception) { Debug.LogError("UIM Studio import failed: " + exception.Message); }
    }

    /// <summary>One prefab per screen: an Image per placed asset at its exact
    /// position and size, buttons with their state sprites wired, and titles
    /// and paragraphs as editable text (TextMeshPro when installed, otherwise
    /// UI Text). Sprite settings are applied first.</summary>
    [MenuItem("Tools/UIM Studio/Build screen prefabs")]
    public static void BuildScreenPrefab()
    {
        var manifest = Load(out var folder);
        if (manifest == null) return;
        var screens = manifest.screens != null && manifest.screens.Length > 0
            ? manifest.screens
            : manifest.screen != null ? new[] { manifest.screen } : new Screen[0];
        var any = false;
        foreach (var screen in screens) if (screen.assets != null && screen.assets.Length > 0) any = true;
        if (!any)
        { EditorUtility.DisplayDialog("UIM Studio", "This pack carries no screen layout. Place the assets in the Screen builder and export the kit again.", "OK"); return; }
        try
        {
            Apply(manifest, folder);
            string lastPath = null;
            foreach (var screen in screens)
            {
                if (screen.assets == null || screen.assets.Length == 0) continue;
                lastPath = BuildOne(manifest, screen, folder);
            }
            AssetDatabase.SaveAssets();
            if (lastPath != null) Selection.activeObject = AssetDatabase.LoadAssetAtPath<GameObject>(lastPath);
        }
        catch (Exception exception) { Debug.LogError("UIM Studio prefab build failed: " + exception.Message); }
    }

    static string BuildOne(Manifest manifest, Screen screen, string folder)
    {
        var scale = manifest.scale > 0f ? manifest.scale : 1f;
        var root = new GameObject(screen.name, typeof(RectTransform)) { layer = LayerMask.NameToLayer("UI") };
        var rootRect = (RectTransform)root.transform;
        rootRect.sizeDelta = new Vector2(screen.width, screen.height);
        var built = 0;
        // Folders from the asset list become empty parents the size of the
        // screen, so children keep their screen coordinates.
        var folders = new System.Collections.Generic.Dictionary<string, RectTransform>();
        foreach (var placement in screen.assets)
        {
            var parent = rootRect;
            if (!string.IsNullOrEmpty(placement.group))
            {
                if (!folders.TryGetValue(placement.group, out parent))
                {
                    var folderObject = new GameObject(placement.group, typeof(RectTransform)) { layer = root.layer };
                    parent = (RectTransform)folderObject.transform;
                    parent.SetParent(rootRect, false);
                    parent.anchorMin = parent.anchorMax = parent.pivot = new Vector2(0f, 1f);
                    parent.anchoredPosition = Vector2.zero;
                    parent.sizeDelta = new Vector2(screen.width, screen.height);
                    folders[placement.group] = parent;
                }
            }
            // Screen coordinates are top-left, y down, at 1x.
            if (placement.text != null && !string.IsNullOrEmpty(placement.text.kind))
            {
                var textObject = new GameObject(placement.name, typeof(RectTransform), typeof(CanvasRenderer)) { layer = root.layer };
                var textRect = (RectTransform)textObject.transform;
                textRect.SetParent(parent, false);
                textRect.anchorMin = textRect.anchorMax = textRect.pivot = new Vector2(0f, 1f);
                textRect.anchoredPosition = new Vector2(placement.x, -placement.y);
                textRect.sizeDelta = new Vector2(placement.width, placement.height);
                AddText(textObject, placement.text);
                built++;
                continue;
            }
            var entry = Array.Find(manifest.assets, a => a.file == placement.file);
            var sprite = entry != null ? AssetDatabase.LoadAssetAtPath<Sprite>(folder + "/" + entry.file) : null;
            if (!sprite) continue;
            var go = new GameObject(placement.name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image)) { layer = root.layer };
            var rect = (RectTransform)go.transform;
            rect.SetParent(parent, false);
            // The PNG holds padding around the body, so the image sits that much up-left.
            rect.anchorMin = rect.anchorMax = rect.pivot = new Vector2(0f, 1f);
            var bodyX = entry.body != null ? entry.body.x / scale : 0f;
            var bodyY = entry.body != null ? entry.body.y / scale : 0f;
            rect.anchoredPosition = new Vector2(placement.x - bodyX, -(placement.y - bodyY));
            rect.sizeDelta = new Vector2(entry.width / scale, entry.height / scale);
            var image = go.GetComponent<Image>();
            image.sprite = sprite;
            image.type = sprite.border.sqrMagnitude > 0f ? Image.Type.Sliced : Image.Type.Simple;
            WireButton(go, image, manifest, folder, placement.name);
            built++;
        }
        var path = AssetDatabase.GenerateUniqueAssetPath(folder + "/" + Safe(screen.name) + ".prefab");
        PrefabUtility.SaveAsPrefabAsset(root, path);
        UnityEngine.Object.DestroyImmediate(root);
        Debug.Log("UIM Studio: built " + path + " with " + built + " assets.");
        return path;
    }

    /// <summary>Editable text for a title or paragraph. Uses TextMeshPro
    /// through reflection when the package is installed, so this file compiles
    /// either way, and falls back to the built-in UI Text.</summary>
    static void AddText(GameObject go, TextInfo info)
    {
        Color color;
        if (!ColorUtility.TryParseHtmlString(info.color, out color)) color = Color.white;
        var paragraph = info.kind == "paragraph";
        var horizontal = info.align == "left" ? "Left" : info.align == "right" ? "Right" : "Center";
        var tmpType = Type.GetType("TMPro.TextMeshProUGUI, Unity.TextMeshPro");
        if (tmpType != null)
        {
            var tmp = go.AddComponent(tmpType);
            Set(tmp, "text", info.content ?? "");
            Set(tmp, "fontSize", info.fontSize > 0f ? info.fontSize : 24f);
            Set(tmp, "color", color);
            var styleProperty = tmpType.GetProperty("fontStyle");
            if (info.bold && styleProperty != null) styleProperty.SetValue(tmp, Enum.ToObject(styleProperty.PropertyType, 1), null);
            var alignProperty = tmpType.GetProperty("alignment");
            if (alignProperty != null)
            {
                // TopLeft / Top / TopRight for paragraphs, Left / Center / Right for titles.
                var name = paragraph ? (horizontal == "Center" ? "Top" : "Top" + horizontal) : horizontal;
                try { alignProperty.SetValue(tmp, Enum.Parse(alignProperty.PropertyType, name), null); } catch { }
            }
            return;
        }
        var text = go.AddComponent<Text>();
        text.text = info.content ?? "";
        text.fontSize = Mathf.RoundToInt(info.fontSize > 0f ? info.fontSize : 24f);
        text.color = color;
        text.fontStyle = info.bold ? FontStyle.Bold : FontStyle.Normal;
        text.lineSpacing = info.lineHeight > 0f ? info.lineHeight : 1f;
        text.horizontalOverflow = HorizontalWrapMode.Wrap;
        text.verticalOverflow = VerticalWrapMode.Overflow;
        text.alignment = paragraph
            ? (horizontal == "Left" ? TextAnchor.UpperLeft : horizontal == "Right" ? TextAnchor.UpperRight : TextAnchor.UpperCenter)
            : (horizontal == "Left" ? TextAnchor.MiddleLeft : horizontal == "Right" ? TextAnchor.MiddleRight : TextAnchor.MiddleCenter);
        try { text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); }
        catch { try { text.font = Resources.GetBuiltinResource<Font>("Arial.ttf"); } catch { } }
    }

    static void Set(object target, string property, object value)
    {
        var info = target.GetType().GetProperty(property);
        if (info != null) info.SetValue(target, value, null);
    }

    static void WireButton(GameObject go, Image image, Manifest manifest, string folder, string assetName)
    {
        Sprite Find(string state)
        {
            var entry = Array.Find(manifest.assets, a => a.name == assetName && a.state == state);
            return entry != null ? AssetDatabase.LoadAssetAtPath<Sprite>(folder + "/" + entry.file) : null;
        }
        var pressed = Find("pressed"); var hover = Find("hover"); var disabled = Find("disabled");
        if (!pressed && !hover && !disabled) return;
        var button = go.AddComponent<Button>();
        button.targetGraphic = image;
        button.transition = Selectable.Transition.SpriteSwap;
        var states = button.spriteState;
        states.highlightedSprite = hover; states.pressedSprite = pressed; states.disabledSprite = disabled;
        states.selectedSprite = hover;
        button.spriteState = states;
    }

    static Manifest Load(out string folder)
    {
        folder = null;
        string manifestPath = AssetDatabase.GetAssetPath(Selection.activeObject);
        if (Path.GetFileName(manifestPath) != "uim-manifest.json")
        { EditorUtility.DisplayDialog("UIM Studio", "Select uim-manifest.json in the Project window first.", "OK"); return null; }
        var manifest = JsonUtility.FromJson<Manifest>(File.ReadAllText(manifestPath));
        if (manifest == null || manifest.version != 1 || manifest.assets == null) { Debug.LogError("UIM Studio: unsupported manifest."); return null; }
        folder = Path.GetDirectoryName(manifestPath).Replace('\\', '/');
        return manifest;
    }

    static int Apply(Manifest manifest, string folder)
    {
        int imported = 0;
        foreach (Entry asset in manifest.assets)
        {
            if (string.IsNullOrEmpty(asset.file) || Path.GetFileName(asset.file) != asset.file || !asset.file.EndsWith(".png", StringComparison.OrdinalIgnoreCase)) continue;
            var importer = AssetImporter.GetAtPath(folder + "/" + asset.file) as TextureImporter;
            if (importer == null) continue;
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            // Pixels per unit follows the export scale, so a 2x or 4x pack keeps
            // the same size and border thickness on screen as 1x.
            importer.spritePixelsPerUnit = (manifest.pixelsPerUnit > 0f ? manifest.pixelsPerUnit : 100f) * (manifest.scale > 0f ? manifest.scale : 1f);
            importer.alphaIsTransparency = true;
            importer.mipmapEnabled = false;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.maxTextureSize = Mathf.Min(8192, Mathf.NextPowerOfTwo(Mathf.Max(asset.width, asset.height)));
            var settings = new TextureImporterSettings();
            importer.ReadTextureSettings(settings);
            settings.spriteMeshType = SpriteMeshType.FullRect;
            importer.SetTextureSettings(settings);
            importer.spriteBorder = new Vector4(asset.left, asset.bottom, asset.right, asset.top);
            importer.SaveAndReimport();
            imported++;
        }
        return imported;
    }

    static string Safe(string name)
    {
        var chars = name.ToCharArray();
        for (var i = 0; i < chars.Length; i++) if (Array.IndexOf(Path.GetInvalidFileNameChars(), chars[i]) >= 0 || chars[i] == '/') chars[i] = '-';
        var safe = new string(chars).Trim();
        return string.IsNullOrEmpty(safe) ? "Screen" : safe;
    }
}
#endif
