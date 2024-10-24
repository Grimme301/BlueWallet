//
//  InterfaceController.swift
//  BlueWalletWatch Extension
//
//  Created by Marcos Rodriguez on 3/6/19.
//

import WatchKit
import WatchConnectivity
import Foundation

class InterfaceController: WKInterfaceController, WCSessionDelegate {

  @IBOutlet weak var walletsTable: WKInterfaceTable!
  @IBOutlet weak var noWalletsAvailableLabel: WKInterfaceLabel!

  override func awake(withContext context: Any?) {
    setupSession()
  }

  override func willActivate() {
    super.willActivate()
    updateUI()
    NotificationCenter.default.addObserver(self, selector: #selector(updateUI), name: WatchDataSource.NotificationName.dataUpdated, object: nil)
  }

  private func setupSession() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  @objc private func updateUI() {
    let wallets = WatchDataSource.shared.wallets
    let isEmpty = wallets.isEmpty
    noWalletsAvailableLabel.setHidden(!isEmpty)
    walletsTable.setHidden(isEmpty)

    if isEmpty { return }

    walletsTable.setNumberOfRows(wallets.count, withRowType: WalletInformation.identifier)
    for index in 0..<wallets.count {
      updateRow(at: index, with: wallets[index])
    }
  }

  private func updateRow(at index: Int, with wallet: Wallet) {
    guard let controller = walletsTable.rowController(at: index) as? WalletInformation else { return }
    controller.configure(with: wallet)
  }

  override func contextForSegue(withIdentifier segueIdentifier: String, in table: WKInterfaceTable, rowIndex: Int) -> Any? {
    return rowIndex
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
    print("Received application context data:", applicationContext)
    WatchDataSource.shared.processData(data: applicationContext)
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
    print("Received user info:", userInfo)
    WatchDataSource.shared.processData(data: userInfo)
  }

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if activationState == .activated {
      print("Watch session activated successfully.")
      WatchDataSource.shared.loadWalletsData()
    } else if let error = error {
      print("Watch session activation failed with error: \(error)")
    }
  }

  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    print("Received message:", message)
    WatchDataSource.shared.processData(data: message)
  }
}
