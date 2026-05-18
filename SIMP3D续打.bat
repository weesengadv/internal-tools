<#*,:&cls
@echo off
cd /d "%~dp0"
set "batchfile=%~f0"
powershell -WindowStyle Hidden -STA -C "Set-Location -LiteralPath ([Environment]::CurrentDirectory);. ([ScriptBlock]::Create([IO.File]::ReadAllText($env:batchfile,[Text.Encoding]::GetEncoding(0) )) )"

exit /b
#>
# .gcode 文件
# $gcode = "squirrel.gcode"
# ${z40} = ";Z:40"

function Hide-Console {
  Write-Verbose 'Hiding PowerShell console...'
  # .NET method for hiding the PowerShell console window
  # https://stackoverflow.com/questions/40617800/opening-powershell-script-and-hide-command-prompt-but-not-the-gui
  Add-Type -Name Window -Namespace Console -MemberDefinition '
  [DllImport("Kernel32.dll")]
  public static extern IntPtr GetConsoleWindow();

  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, Int32 nCmdShow);
  '
  $consolePtr = [Console.Window]::GetConsoleWindow()
  [Console.Window]::ShowWindow($consolePtr, 0) # 0 = hide
}
# Hide-Console
Add-Type -AssemblyName PresentationFramework, System.Xml.Linq
$strXaml = @'
<Window
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:WpfGCode"
        mc:Ignorable="d"
        Title="GCodeWin" Height="220" Width="572" FontFamily="Microsoft YaHei UI">
    <Grid>
        <Label x:Name="label_openfile" Content="要处理的文件:" HorizontalAlignment="Left" Margin="19,17,0,0" VerticalAlignment="Top"/>
        <TextBox x:Name="textBox_openfile" HorizontalAlignment="Left" Height="23" Margin="118,21,0,0" TextWrapping="Wrap" Text="" VerticalAlignment="Top" Width="335"/>
        <Button x:Name="button_openfile" Content="打开" HorizontalAlignment="Left" Margin="471,21,0,0" VerticalAlignment="Top" Width="75" Height="23"/>
        <Label x:Name="label_layers" Content="层数" HorizontalAlignment="Left" Margin="70,60,0,0" VerticalAlignment="Top"/>
        <TextBox x:Name="textBox_layers" HorizontalAlignment="Left" Height="23" Margin="118,64,0,0" TextWrapping="Wrap" Text="" VerticalAlignment="Top" Width="71"/>
        <Label x:Name="label_height" Content="层高" HorizontalAlignment="Left" Margin="256,64,0,0" VerticalAlignment="Top"/>
        <TextBox x:Name="textBox_height" HorizontalAlignment="Left" Height="23" Margin="295,64,0,0" TextWrapping="Wrap" Text="" VerticalAlignment="Top" Width="94"/>
        <Button x:Name="button_savefile" Content="导出文件" HorizontalAlignment="Left" Margin="215,108,0,0" VerticalAlignment="Top" Width="75" Height="26"/>
        <TextBlock x:Name="textBlock_status" HorizontalAlignment="Left" Margin="118,154,0,0" TextWrapping="Wrap" Text="" VerticalAlignment="Top"/>
    </Grid>
</Window>

'@

$wpfWin = [System.Windows.Markup.XamlReader]::Parse($strXaml)
$btn_openfile = $wpfWin.FindName('button_openfile')
$btn_savefile = $wpfWin.FindName('button_savefile')
$box_openfile = $wpfWin.FindName('textBox_openfile')
$box_layers = $wpfWin.FindName('textBox_layers')
$box_height = $wpfWin.FindName('textBox_height')
$block_status = $wpfWin.FindName('textBlock_status')

$btn_openfile.add_Click( {
    param($oSender, $oArgs)
    $openFileDialog = New-Object Microsoft.Win32.OpenFileDialog -Property @{
      CheckFileExists = $true
      CheckPathExists = $true
      Filter          = "gcode files (*.gcode)|*.gcode|Text files (*.txt)|*.txt|All files (*.*)|*.*"
      FilterIndex     = 0
    }
    if ($openFileDialog.ShowDialog($wpfWin)) {
      $box_openfile.Text = $openFileDialog.FileName
    }
  })
$btn_savefile.add_Click( {
    param($oSender, $oArgs)
    $saveFileDialog = New-Object Microsoft.Win32.SaveFileDialog -Property @{
      CheckFileExists = $false
      CheckPathExists = $true
      Filter          = "gcode files (*.gcode)|*.gcode|Text files (*.txt)|*.txt|All files (*.*)|*.*"
      FilterIndex     = 0
    }
    if ($saveFileDialog.ShowDialog($wpfWin)) {
      $layers = $box_layers.Text -as [double]
      $height = $box_height.Text -as [double]
      $z40 = ';Z:{0}' -f ($layers * $height)
      # "z40=$z40" | Out-Host
      [IO.File]::WriteAllText($saveFileDialog.FileName, ($Script:readText -replace "(?mis)^PRINT_START\n((?>[^\n]*\n){3}).*?(^${z40}(?:\n|\z))",'${1}${2}'))
      if ($?) {
        $block_status.Text = "导出文件:$($saveFileDialog.FileName) 成功."
        $block_status.Foreground = [System.Windows.Media.Brushes]::Green
      } else {
        $block_status.Text = "导出文件:$($saveFileDialog.FileName) 失败."
        $block_status.Foreground = [System.Windows.Media.Brushes]::Red
      }
    }
  })
$box_openfile.add_TextChanged( {
    param($oSender, $oArgs)
    if ([IO.File]::Exists($oSender.Text)) {
      $Script:readText = [IO.File]::ReadAllText($oSender.Text)
    } else {
      $Script:readText = ''
    }
  })
$wpfWin.ShowDialog()
# "替换文件:${z40}"
# $text = [IO.File]::ReadAllText($gcode)
# $text = $text -replace "(?mis)^print start.*?(?=^${z40})"
# [IO.File]::WriteAllText($gcode, $text)